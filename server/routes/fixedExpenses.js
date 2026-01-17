/**
 * Fixed Expense Routes
 * 
 * FIXED: Uses requireOwnership middleware (DRY)
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireAuth, requireOwnership } = require('../middleware/requireAuth');
const { success, errors } = require('../utils/responseUtils');
const { createFixedExpenseSchema, idParamSchema, validate } = require('../schemas');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/fixed-expenses - List all fixed expenses for user
 */
router.get('/', async (req, res, next) => {
    try {
        const expenses = await prisma.fixedExpense.findMany({
            where: { userId: req.userId },
            orderBy: { dueDay: 'asc' }
        });
        res.json(success(expenses));
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/fixed-expenses - Create new fixed expense
 */
router.post('/', validate(createFixedExpenseSchema), async (req, res, next) => {
    try {
        const { description, amount, currency, dueDay } = req.body;

        const expense = await prisma.fixedExpense.create({
            data: {
                description: description.trim(),
                amount: parseFloat(amount),
                currency: currency || 'USD',
                dueDay: parseInt(dueDay),
                userId: req.userId
            }
        });

        res.status(201).json(success(expense, 'Gasto fijo creado'));
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/fixed-expenses/:id - Update fixed expense
 * Uses requireOwnership middleware (DRY)
 */
router.put('/:id',
    validate(idParamSchema, 'params'),
    requireOwnership('fixedExpense'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { description, amount, currency, dueDay, isActive } = req.body;

            const updateData = {};
            if (description !== undefined) updateData.description = description.trim();
            if (amount !== undefined) updateData.amount = parseFloat(amount);
            if (currency !== undefined) updateData.currency = currency;
            if (dueDay !== undefined) updateData.dueDay = parseInt(dueDay);
            if (isActive !== undefined) updateData.isActive = isActive;

            const updated = await prisma.fixedExpense.update({
                where: { id },
                data: updateData
            });

            res.json(success(updated, 'Gasto fijo actualizado'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/fixed-expenses/:id - Delete fixed expense
 * Uses requireOwnership middleware (DRY)
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    requireOwnership('fixedExpense'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            await prisma.fixedExpense.delete({ where: { id } });
            res.json(success({ id }, 'Gasto fijo eliminado'));
        } catch (error) {
            next(error);
        }
    }
);

// ═══════════════════════════════════════════════════════════════
// UPCOMING BILLS (New endpoint for Lovable UI BillCalendar)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/fixed-expenses/upcoming - Get upcoming bills for calendar
 * Query params: days (default 30)
 */
router.get('/upcoming', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const now = new Date();
        const today = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const expenses = await prisma.fixedExpense.findMany({
            where: {
                userId: req.userId,
                isActive: true,
                deletedAt: null
            },
            orderBy: { dueDay: 'asc' }
        });

        // Calculate next due date for each expense
        const upcomingBills = expenses.map(expense => {
            let nextDueDate;

            // If dueDay is after today, it's this month
            // Otherwise, it's next month
            if (expense.dueDay >= today) {
                nextDueDate = new Date(currentYear, currentMonth, expense.dueDay);
            } else {
                // Next month
                nextDueDate = new Date(currentYear, currentMonth + 1, expense.dueDay);
            }

            // Handle month overflow for days > 28
            if (nextDueDate.getDate() !== expense.dueDay) {
                // Day doesn't exist in that month, use last day of previous month
                nextDueDate = new Date(currentYear, currentMonth + 2, 0);
            }

            const daysUntilDue = Math.ceil((nextDueDate - now) / (1000 * 60 * 60 * 24));

            return {
                ...expense,
                nextDate: nextDueDate.toISOString().split('T')[0],
                daysUntilDue,
                isOverdue: daysUntilDue < 0
            };
        }).filter(bill => bill.daysUntilDue <= days);

        res.json(success(upcomingBills));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
