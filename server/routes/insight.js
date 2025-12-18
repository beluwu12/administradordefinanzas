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
 */
router.get('/summary', async (req, res, next) => {
    try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const userCountry = req.user?.country || 'VE';
        const countryConfig = getCountryConfig(userCountry);
        const userIsDual = isDualCurrency(userCountry);
        const defaultCurrency = countryConfig.defaultCurrency;

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: thirtyDaysAgo },
                deletedAt: null // Respect soft delete
            },
            include: { tags: true }
        });

        // Initialize summary with user's currency (and VES for VE users)
        const summary = {
            totalIncome: {},
            totalExpense: {},
            netSavings: {},
            topExpenseTags: []
        };

        // Initialize currencies based on country
        const currencies = userIsDual ? [defaultCurrency, 'VES'] : [defaultCurrency];
        currencies.forEach(curr => {
            summary.totalIncome[curr] = new Decimal(0);
            summary.totalExpense[curr] = new Decimal(0);
            summary.netSavings[curr] = new Decimal(0);
        });

        const tagMap = {};

        transactions.forEach(tx => {
            const amount = new Decimal(tx.amount);
            const currency = tx.currency || defaultCurrency;

            // Only process currencies relevant to this user
            if (!currencies.includes(currency)) return;

            if (tx.type === 'INCOME') {
                summary.totalIncome[currency] = summary.totalIncome[currency].plus(amount);
            } else if (tx.type === 'EXPENSE') {
                summary.totalExpense[currency] = summary.totalExpense[currency].plus(amount);

                // Track tag usage
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

        // Calculate net savings for each currency
        currencies.forEach(curr => {
            summary.netSavings[curr] = summary.totalIncome[curr].minus(summary.totalExpense[curr]);
        });

        // Convert to regular numbers
        const result = {
            totalIncome: {},
            totalExpense: {},
            netSavings: {}
        };

        currencies.forEach(curr => {
            result.totalIncome[curr] = summary.totalIncome[curr].toNumber();
            result.totalExpense[curr] = summary.totalExpense[curr].toNumber();
            result.netSavings[curr] = summary.netSavings[curr].toNumber();
        });

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
            userCurrency: defaultCurrency,
            isDual: userIsDual
        }));
    } catch (error) {
        next(error);
    }
});

module.exports = router;

