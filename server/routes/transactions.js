const express = require('express');
const prisma = require('../db');
const requireUser = require('../middleware/auth');
const router = express.Router();

router.use(requireUser);

// GET /api/transactions - List mine
router.get('/', async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.userId },
            include: { tags: true },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transactions' });
    }
});

// POST /api/transactions - Create
router.post('/', async (req, res) => {
    const { amount, currency, type, description, source, tags, date, exchangeRate } = req.body;

    try {
        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                currency,
                type,
                description,
                source,
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
                date: date ? new Date(date) : new Date(),
                userId: req.userId,
                tags: tags ? {
                    connect: tags.map(tagId => ({ id: tagId }))
                } : undefined
            },
            include: { tags: true }
        });
        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating transaction' });
    }
});

// PUT /api/transactions/:id - Update
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { amount, currency, type, description, source, tags, date, exchangeRate } = req.body;

    try {
        // Ensure ownership
        const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
        if (!existing) return res.status(404).json({ error: 'Transaction not found or unauthorized' });

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                amount: parseFloat(amount),
                currency,
                type,
                description,
                source,
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
                date: date ? new Date(date) : undefined,
                tags: Array.isArray(tags) ? {
                    set: tags.map(tagId => ({ id: tagId }))
                } : undefined
            },
            include: { tags: true }
        });
        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating transaction' });
    }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership first using deleteMany (safe way if ID unique) or findFirst
        const count = await prisma.transaction.deleteMany({
            where: { id, userId: req.userId }
        });

        if (count.count === 0) {
            return res.status(404).json({ error: 'Not found or unauthorized' });
        }

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting transaction' });
    }
});

// GET /api/transactions/balance - Calculate Balance Efficiently
router.get('/balance', async (req, res) => {
    try {
        // Efficient aggregation using Prisma GroupBy
        const aggregations = await prisma.transaction.groupBy({
            by: ['currency', 'type'],
            where: { userId: req.userId },
            _sum: {
                amount: true,
            },
        });

        const balance = { USD: 0, VES: 0 };

        aggregations.forEach(agg => {
            const val = agg._sum.amount || 0;
            if (agg.currency === 'USD') {
                balance.USD += agg.type === 'INCOME' ? val : -val;
            } else if (agg.currency === 'VES') {
                balance.VES += agg.type === 'INCOME' ? val : -val;
            }
        });

        res.json(balance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error calculating balance' });
    }
});

module.exports = router;
