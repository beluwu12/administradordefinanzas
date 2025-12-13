/**
 * Fixed Expense Routes
 * Updated with validation and standardized responses
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireAuth, verifyOwnership } = require('../middleware/requireAuth');
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
        const { description, amount, currency, dueDay, startDate } = req.body;

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
 */
router.put('/:id',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check ownership
            const existing = await prisma.fixedExpense.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!existing) {
                const errResponse = errors.notFound('Gasto fijo');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(existing.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

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
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check ownership
            const existing = await prisma.fixedExpense.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!existing) {
                const errResponse = errors.notFound('Gasto fijo');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(existing.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            await prisma.fixedExpense.delete({ where: { id } });
            res.json(success({ id }, 'Gasto fijo eliminado'));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
