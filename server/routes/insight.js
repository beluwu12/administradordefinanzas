const express = require('express');
const router = express.Router();
const prisma = require('../db');
const requireUser = require('../middleware/auth');

router.use(requireUser);

// GET /api/insight/summary - 30 Day financial summary
router.get('/summary', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch transactions from last 30 days
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: thirtyDaysAgo }
            },
            include: { tags: true }
        });

        const summary = {
            totalIncome: { USD: 0, VES: 0 },
            totalExpense: { USD: 0, VES: 0 },
            netSavings: { USD: 0, VES: 0 },
            topExpenseTags: [],
        };

        const tagMap = {};

        transactions.forEach(tx => {
            const amount = tx.amount;
            const currency = tx.currency; // 'USD' or 'VES'

            // Validate amount and currency
            if (!isFinite(amount) || isNaN(amount)) {
                console.warn(`Invalid amount in transaction ${tx.id}: ${amount}`);
                return;
            }
            if (!currency || !['USD', 'VES'].includes(currency)) {
                console.warn(`Invalid currency in transaction ${tx.id}: ${currency}`);
                return;
            }

            if (tx.type === 'INCOME') {
                summary.totalIncome[currency] = (summary.totalIncome[currency] || 0) + amount;
            } else if (tx.type === 'EXPENSE') {
                summary.totalExpense[currency] = (summary.totalExpense[currency] || 0) + amount;

                // Track tag usage for expenses
                if (Array.isArray(tx.tags)) {
                    tx.tags.forEach(tag => {
                        if (tag && tag.name) {
                            if (!tagMap[tag.name]) {
                                tagMap[tag.name] = { name: tag.name, totalUSD: 0, totalVES: 0, count: 0 };
                            }
                            tagMap[tag.name][`total${currency}`] = (tagMap[tag.name][`total${currency}`] || 0) + amount;
                            tagMap[tag.name].count += 1;
                        }
                    });
                }
            }
        });

        // Calculate Net Savings
        summary.netSavings.USD = summary.totalIncome.USD - summary.totalExpense.USD;
        summary.netSavings.VES = summary.totalIncome.VES - summary.totalExpense.VES;

        // Determine Top 3 Expense Tags (Prioritizing USD impact for simplicity, or count)
        // Let's sort by USD impact first
        summary.topExpenseTags = Object.values(tagMap)
            .sort((a, b) => b.totalUSD - a.totalUSD)
            .slice(0, 3);

        res.json(summary);
    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).json({ error: 'Error calculating summary' });
    }
});

module.exports = router;
