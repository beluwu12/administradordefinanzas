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

module.exports = router;

