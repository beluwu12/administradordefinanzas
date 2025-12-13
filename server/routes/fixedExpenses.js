const express = require('express');
const prisma = require('../db');
const requireUser = require('../middleware/auth');
const router = express.Router();

router.use(requireUser);

// GET /api/fixed-expenses - List
router.get('/', async (req, res) => {
    try {
        const expenses = await prisma.fixedExpense.findMany({
            where: { userId: req.userId },
            orderBy: { dueDay: 'asc' }
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching fixed expenses' });
    }
});

// POST /api/fixed-expenses - Create
router.post('/', async (req, res) => {
    const { amount, currency, description, dueDay, startDate } = req.body;

    try {
        let day = dueDay;
        // If startDate is provided (YYYY-MM-DD), extract the day
        if (startDate) {
            const dateObj = new Date(startDate);
            if (!isNaN(dateObj.getTime())) {
                day = parseInt(startDate.split('-')[2]);
            }
        }

        const parsedAmount = parseFloat(amount);
        const parsedDay = parseInt(day);

        // Validation
        if (isNaN(parsedAmount)) {
            return res.status(400).json({ error: 'Monto inválido (debe ser un número)' });
        }
        if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
            return res.status(400).json({ error: 'Día inválido (debe ser entre 1 y 31)' });
        }
        if (!description) {
            return res.status(400).json({ error: 'Descripción requerida' });
        }

        const expense = await prisma.fixedExpense.create({
            data: {
                amount: parsedAmount,
                currency: currency || 'USD',
                description,
                dueDay: parsedDay,
                userId: req.userId
            }
        });
        res.json(expense);
    } catch (error) {
        console.error('SERVER ERROR creating fixed expense:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear gasto' });
    }
});

// DELETE /api/fixed-expenses/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await prisma.fixedExpense.deleteMany({
            where: { id, userId: req.userId }
        });
        if (count.count === 0) return res.status(404).json({ error: 'Not found' });

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting' });
    }
});

// GET /api/fixed-expenses/insight - Budget Analysis
router.get('/insight', async (req, res) => {
    try {
        // 1. Calculate Monthly Fixed Expenses
        const fixedExpenses = await prisma.fixedExpense.findMany({ where: { isActive: true, userId: req.userId } });
        const totalFixed = fixedExpenses.reduce((acc, curr) => {
            if (!acc[curr.currency]) acc[curr.currency] = 0;
            acc[curr.currency] += curr.amount;
            return acc;
        }, {});

        // 2. Fetch Average Monthly Income (Simple approximation based on last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentIncome = await prisma.transaction.findMany({
            where: {
                type: 'INCOME',
                date: { gte: thirtyDaysAgo },
                userId: req.userId
            }
        });

        const totalIncome = recentIncome.reduce((acc, curr) => {
            if (!acc[curr.currency]) acc[curr.currency] = 0;
            acc[curr.currency] += curr.amount;
            return acc;
        }, {});

        // 3. Fetch "Quincena" Specific Income
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const quincenaIncomeTransactions = await prisma.transaction.findMany({
            where: {
                type: 'INCOME',
                date: { gte: startOfMonth },
                userId: req.userId,
                tags: {
                    some: {
                        name: {
                            in: ['QUINCENA', 'Quincena', 'quincena']
                        }
                    }
                }
            }
        });

        const totalQuincena = quincenaIncomeTransactions.reduce((acc, curr) => {
            if (!acc[curr.currency]) acc[curr.currency] = 0;
            acc[curr.currency] += curr.amount;
            return acc;
        }, {});

        const responsePayload = {
            fixedExpenses: totalFixed,
            recentMonthlyIncome: totalIncome,
            details: fixedExpenses,
            quincenaFixed: {
                targetUSD: (totalFixed.USD || 0) / 2,
                targetVES: (totalFixed.VES || 0) / 2,
                collectedUSD: totalQuincena.USD || 0,
                collectedVES: totalQuincena.VES || 0
            }
        };

        res.json(responsePayload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error calculating insight' });
    }
});

module.exports = router;
