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

    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
        return res.status(400).json({ error: 'Type must be INCOME or EXPENSE' });
    }
    if (!currency || !['USD', 'VES'].includes(currency)) {
        return res.status(400).json({ error: 'Currency must be USD or VES' });
    }
    if (!description || description.trim() === '') {
        return res.status(400).json({ error: 'Description is required' });
    }

    const parsedAmount = parseFloat(amount);
    const parsedExchangeRate = exchangeRate ? parseFloat(exchangeRate) : null;

    if (isNaN(parsedAmount)) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    if (parsedExchangeRate !== null && (isNaN(parsedExchangeRate) || parsedExchangeRate <= 0)) {
        return res.status(400).json({ error: 'Invalid exchange rate' });
    }

    try {
        const transaction = await prisma.transaction.create({
            data: {
                amount: parsedAmount,
                currency,
                type,
                description: description.trim(),
                source: source ? source.trim() : null,
                exchangeRate: parsedExchangeRate,
                date: date ? new Date(date) : new Date(),
                userId: req.userId,
                tags: tags && Array.isArray(tags) && tags.length > 0 ? {
                    connect: tags.map(tagId => ({ id: tagId }))
                } : undefined
            },
            include: { tags: true }
        });
        res.json(transaction);
    } catch (error) {
        console.error("[Transactions POST] Error:", error);
        res.status(500).json({ error: `[Transactions] Error creando transacción: ${error.message}` });
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

        // Validation
        if (amount !== undefined && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        if (type && !['INCOME', 'EXPENSE'].includes(type)) {
            return res.status(400).json({ error: 'Type must be INCOME or EXPENSE' });
        }
        if (currency && !['USD', 'VES'].includes(currency)) {
            return res.status(400).json({ error: 'Currency must be USD or VES' });
        }
        if (description !== undefined && (!description || description.trim() === '')) {
            return res.status(400).json({ error: 'Description cannot be empty' });
        }

        const parsedAmount = amount !== undefined ? parseFloat(amount) : undefined;
        const parsedExchangeRate = exchangeRate !== undefined ? (exchangeRate ? parseFloat(exchangeRate) : null) : undefined;

        if (parsedAmount !== undefined && isNaN(parsedAmount)) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (parsedExchangeRate !== undefined && parsedExchangeRate !== null && (isNaN(parsedExchangeRate) || parsedExchangeRate <= 0)) {
            return res.status(400).json({ error: 'Invalid exchange rate' });
        }

        const updateData = {};
        if (parsedAmount !== undefined) updateData.amount = parsedAmount;
        if (currency) updateData.currency = currency;
        if (type) updateData.type = type;
        if (description !== undefined) updateData.description = description.trim();
        if (source !== undefined) updateData.source = source ? source.trim() : null;
        if (parsedExchangeRate !== undefined) updateData.exchangeRate = parsedExchangeRate;
        if (date) updateData.date = new Date(date);
        if (tags !== undefined) {
            updateData.tags = tags && Array.isArray(tags) ? {
                set: tags.map(tagId => ({ id: tagId }))
            } : { set: [] };
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
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
            // Ensure val is a valid number
            if (isNaN(val) || !isFinite(val)) {
                console.warn(`Invalid amount in aggregation: ${val}`);
                return;
            }
            if (agg.currency === 'USD') {
                balance.USD += agg.type === 'INCOME' ? val : -val;
            } else if (agg.currency === 'VES') {
                balance.VES += agg.type === 'INCOME' ? val : -val;
            }
        });

        // Ensure balance values are finite numbers
        balance.USD = isFinite(balance.USD) ? balance.USD : 0;
        balance.VES = isFinite(balance.VES) ? balance.VES : 0;

        res.json(balance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error calculating balance' });
    }
});

module.exports = router;
