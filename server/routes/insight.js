/**
 * Insight Routes - Financial Summaries and Analytics
 * Updated with multi-currency support
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const Decimal = require('decimal.js');
const { subDays } = require('date-fns');
const { requireAuth } = require('../middleware/requireAuth');
const { success } = require('../utils/responseUtils');
const { getCountryConfig, isDualCurrency } = require('../config/countries');

router.use(requireAuth);

/**
 * GET /api/insight/summary - 30 Day financial summary
 * Returns totals in user's default currency (and VES for VE users)
 * Includes month-over-month change percentage
 */
router.get('/summary', async (req, res, next) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        const sixtyDaysAgo = subDays(now, 60);
        const userCountry = req.user?.country || 'VE';
        const countryConfig = getCountryConfig(userCountry);
        const userIsDual = isDualCurrency(userCountry);
        const defaultCurrency = countryConfig.defaultCurrency;

        // Fetch current period (last 30 days)
        const currentTransactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: thirtyDaysAgo },
                deletedAt: null
            },
            include: { tags: true }
        });

        // Fetch previous period (30-60 days ago) for comparison
        const previousTransactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
                deletedAt: null
            }
        });

        // Initialize currencies based on country
        const currencies = userIsDual ? [defaultCurrency, 'VES'] : [defaultCurrency];

        // Calculate current period totals
        const summary = {
            totalIncome: {},
            totalExpense: {},
            netSavings: {}
        };

        currencies.forEach(curr => {
            summary.totalIncome[curr] = new Decimal(0);
            summary.totalExpense[curr] = new Decimal(0);
        });

        const tagMap = {};

        currentTransactions.forEach(tx => {
            const amount = new Decimal(tx.amount);
            const currency = tx.currency || defaultCurrency;

            if (!currencies.includes(currency)) return;

            if (tx.type === 'INCOME') {
                summary.totalIncome[currency] = summary.totalIncome[currency].plus(amount);
            } else if (tx.type === 'EXPENSE') {
                summary.totalExpense[currency] = summary.totalExpense[currency].plus(amount);

                if (Array.isArray(tx.tags)) {
                    tx.tags.forEach(tag => {
                        if (tag?.name) {
                            if (!tagMap[tag.name]) {
                                tagMap[tag.name] = {
                                    name: tag.name,
                                    total: new Decimal(0),
                                    count: 0
                                };
                            }
                            tagMap[tag.name].total = tagMap[tag.name].total.plus(amount);
                            tagMap[tag.name].count += 1;
                        }
                    });
                }
            }
        });

        // Calculate previous period net savings for comparison
        let previousNetPrimary = new Decimal(0);
        previousTransactions.forEach(tx => {
            const amount = new Decimal(tx.amount);
            const currency = tx.currency || defaultCurrency;

            if (currency === defaultCurrency) {
                if (tx.type === 'INCOME') {
                    previousNetPrimary = previousNetPrimary.plus(amount);
                } else if (tx.type === 'EXPENSE') {
                    previousNetPrimary = previousNetPrimary.minus(amount);
                }
            }
        });

        // Calculate net savings and change
        const result = {
            totalIncome: {},
            totalExpense: {},
            netSavings: {}
        };

        let currentNetPrimary = new Decimal(0);
        currencies.forEach(curr => {
            const income = summary.totalIncome[curr];
            const expense = summary.totalExpense[curr];
            const net = income.minus(expense);

            result.totalIncome[curr] = income.toNumber();
            result.totalExpense[curr] = expense.toNumber();
            result.netSavings[curr] = net.toNumber();

            if (curr === defaultCurrency) {
                currentNetPrimary = net;
            }
        });

        // Calculate percentage change
        let changePercent = 0;
        if (!previousNetPrimary.isZero()) {
            changePercent = currentNetPrimary
                .minus(previousNetPrimary)
                .dividedBy(previousNetPrimary.abs())
                .times(100)
                .toNumber();
        } else if (!currentNetPrimary.isZero()) {
            changePercent = currentNetPrimary.isPositive() ? 100 : -100;
        }

        // Sort top expense tags
        const topExpenseTags = Object.values(tagMap)
            .map(t => ({
                name: t.name,
                total: t.total.toNumber(),
                count: t.count
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

        res.json(success({
            ...result,
            topExpenseTags,
            changePercent: Math.round(changePercent * 10) / 10, // Round to 1 decimal
            userCurrency: defaultCurrency,
            isDual: userIsDual
        }));
    } catch (error) {
        next(error);
    }
});

// ═══════════════════════════════════════════════════════════════
// MONTHLY COMPARISON (New endpoint for Lovable UI charts)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/insight/monthly-comparison - Income vs Expense by month
 * Query params: months (default 5)
 */
router.get('/monthly-comparison', async (req, res, next) => {
    try {
        const months = parseInt(req.query.months) || 5;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: startDate },
                deletedAt: null
            },
            select: {
                amount: true,
                type: true,
                date: true
            }
        });

        // Group by month
        const monthlyData = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[key]) {
                monthlyData[key] = {
                    month: monthNames[txDate.getMonth()],
                    year: txDate.getFullYear(),
                    income: 0,
                    expenses: 0
                };
            }

            if (tx.type === 'INCOME') {
                monthlyData[key].income += tx.amount;
            } else {
                monthlyData[key].expenses += tx.amount;
            }
        });

        // Convert to array and sort
        const result = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, data]) => data);

        res.json(success(result));
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/insight/balance-history - Balance over time
 * Query params: days (default 30)
 */
router.get('/balance-history', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const now = new Date();
        const startDate = subDays(now, days);

        // Get all transactions before the period to calculate initial balance
        const previousTransactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { lt: startDate },
                deletedAt: null
            },
            select: { amount: true, type: true }
        });

        let runningBalance = previousTransactions.reduce((sum, tx) => {
            return tx.type === 'INCOME' ? sum + tx.amount : sum - tx.amount;
        }, 0);

        // Get transactions in the period
        const periodTransactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: startDate },
                deletedAt: null
            },
            orderBy: { date: 'asc' },
            select: { amount: true, type: true, date: true }
        });

        // Group by day
        const dailyChanges = {};
        periodTransactions.forEach(tx => {
            const dateKey = tx.date.toISOString().split('T')[0];
            if (!dailyChanges[dateKey]) {
                dailyChanges[dateKey] = 0;
            }
            dailyChanges[dateKey] += tx.type === 'INCOME' ? tx.amount : -tx.amount;
        });

        // Build result array
        const result = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];

            if (dailyChanges[dateKey]) {
                runningBalance += dailyChanges[dateKey];
            }

            result.push({
                date: dateKey,
                balance: Math.round(runningBalance * 100) / 100
            });
        }

        res.json(success(result));
    } catch (error) {
        next(error);
    }
});

module.exports = router;

