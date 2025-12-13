/**
 * Insight Routes - Financial Summaries and Analytics
 * Updated with standardized responses
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const Decimal = require('decimal.js');
const { subDays } = require('date-fns');
const { requireAuth } = require('../middleware/requireAuth');
const { success } = require('../utils/responseUtils');

router.use(requireAuth);

/**
 * GET /api/insight/summary - 30 Day financial summary
 */
router.get('/summary', async (req, res, next) => {
    try {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: thirtyDaysAgo }
            },
            include: { tags: true }
        });

        // Use decimal.js for precise calculations
        const summary = {
            totalIncome: { USD: new Decimal(0), VES: new Decimal(0) },
            totalExpense: { USD: new Decimal(0), VES: new Decimal(0) },
            netSavings: { USD: new Decimal(0), VES: new Decimal(0) },
            topExpenseTags: []
        };

        const tagMap = {};

        transactions.forEach(tx => {
            const amount = new Decimal(tx.amount);
            const currency = tx.currency || 'USD';

            if (!['USD', 'VES'].includes(currency)) return;

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
                                    totalUSD: new Decimal(0),
                                    totalVES: new Decimal(0),
                                    count: 0
                                };
                            }
                            tagMap[tag.name][`total${currency}`] = tagMap[tag.name][`total${currency}`].plus(amount);
                            tagMap[tag.name].count += 1;
                        }
                    });
                }
            }
        });

        // Calculate net savings
        summary.netSavings.USD = summary.totalIncome.USD.minus(summary.totalExpense.USD);
        summary.netSavings.VES = summary.totalIncome.VES.minus(summary.totalExpense.VES);

        // Convert to regular numbers and sort top expense tags
        const topExpenseTags = Object.values(tagMap)
            .map(t => ({
                name: t.name,
                totalUSD: t.totalUSD.toNumber(),
                totalVES: t.totalVES.toNumber(),
                count: t.count
            }))
            .sort((a, b) => b.totalUSD - a.totalUSD)
            .slice(0, 3);

        res.json(success({
            totalIncome: {
                USD: summary.totalIncome.USD.toNumber(),
                VES: summary.totalIncome.VES.toNumber()
            },
            totalExpense: {
                USD: summary.totalExpense.USD.toNumber(),
                VES: summary.totalExpense.VES.toNumber()
            },
            netSavings: {
                USD: summary.netSavings.USD.toNumber(),
                VES: summary.netSavings.VES.toNumber()
            },
            topExpenseTags
        }));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
