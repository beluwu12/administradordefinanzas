/**
 * Budget Routes - Category spending limits with rollover
 * 
 * New endpoints for Lovable UI integration
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireAuth, requireOwnership } = require('../middleware/requireAuth');
const { success, errors } = require('../utils/responseUtils');
const { validate, idParamSchema } = require('../schemas');
const { z } = require('zod');

// Schemas
const createBudgetSchema = z.object({
    body: z.object({
        tagId: z.string().uuid(),
        limit: z.number().positive(),
        month: z.number().int().min(1).max(12).optional(),
        year: z.number().int().min(2020).max(2100).optional()
    })
});

const updateBudgetSchema = z.object({
    body: z.object({
        limit: z.number().positive().optional(),
        rolloverEnabled: z.boolean().optional()
    })
});

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/budgets - List all budgets for current month with spent calculation
 */
router.get('/', async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
        const targetYear = year ? parseInt(year) : now.getFullYear();

        // Start and end of month for transaction query
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        const budgets = await prisma.budget.findMany({
            where: {
                userId: req.userId,
                month: targetMonth,
                year: targetYear
            },
            include: { tag: true }
        });

        // Calculate spent for each budget
        const budgetsWithSpent = await Promise.all(
            budgets.map(async (budget) => {
                const spentResult = await prisma.transaction.aggregate({
                    where: {
                        userId: req.userId,
                        type: 'EXPENSE',
                        deletedAt: null,
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        },
                        tags: {
                            some: { id: budget.tagId }
                        }
                    },
                    _sum: { amount: true }
                });

                const spent = spentResult._sum.amount || 0;
                const remaining = budget.limit + budget.rolloverAmount - spent;

                return {
                    ...budget,
                    spent,
                    remaining,
                    percentage: budget.limit > 0 ? (spent / budget.limit) * 100 : 0
                };
            })
        );

        res.json(success(budgetsWithSpent));
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/budgets - Create a new budget
 */
router.post('/', validate(createBudgetSchema), async (req, res, next) => {
    try {
        const { tagId, limit, month, year } = req.body;
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        // Verify tag belongs to user
        const tag = await prisma.tag.findFirst({
            where: { id: tagId, userId: req.userId }
        });

        if (!tag) {
            const errResponse = errors.notFound('Categoría');
            return res.status(errResponse.status).json(errResponse);
        }

        // Check for existing budget
        const existing = await prisma.budget.findFirst({
            where: {
                tagId,
                month: targetMonth,
                year: targetYear,
                userId: req.userId
            }
        });

        if (existing) {
            const errResponse = errors.conflict('Ya existe un presupuesto para esta categoría en este mes');
            return res.status(errResponse.status).json(errResponse);
        }

        const budget = await prisma.budget.create({
            data: {
                tagId,
                limit,
                month: targetMonth,
                year: targetYear,
                userId: req.userId
            },
            include: { tag: true }
        });

        res.status(201).json(success(budget, 'Presupuesto creado'));
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/budgets/:id - Update a budget
 */
router.put('/:id',
    validate(idParamSchema, 'params'),
    validate(updateBudgetSchema),
    requireOwnership('budget'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { limit, rolloverEnabled } = req.body;

            const updateData = {};
            if (limit !== undefined) updateData.limit = limit;
            if (rolloverEnabled !== undefined) updateData.rolloverEnabled = rolloverEnabled;

            const budget = await prisma.budget.update({
                where: { id },
                data: updateData,
                include: { tag: true }
            });

            res.json(success(budget, 'Presupuesto actualizado'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/budgets/:id - Delete a budget
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    requireOwnership('budget'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            await prisma.budget.delete({ where: { id } });
            res.json(success({ id }, 'Presupuesto eliminado'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/budgets/rollover - Execute monthly rollover for all budgets
 * Should be called at the start of each month (via cron or manually)
 */
router.post('/rollover', async (req, res, next) => {
    try {
        const now = new Date();
        const prevMonth = now.getMonth(); // 0-indexed, so this is previous month
        const prevYear = prevMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const actualPrevMonth = prevMonth === 0 ? 12 : prevMonth;

        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Get all budgets from previous month with rollover enabled
        const prevBudgets = await prisma.budget.findMany({
            where: {
                userId: req.userId,
                month: actualPrevMonth,
                year: prevYear,
                rolloverEnabled: true
            }
        });

        const results = [];

        for (const prevBudget of prevBudgets) {
            // Calculate spent for previous month
            const startOfPrevMonth = new Date(prevYear, actualPrevMonth - 1, 1);
            const endOfPrevMonth = new Date(prevYear, actualPrevMonth, 0, 23, 59, 59, 999);

            const spentResult = await prisma.transaction.aggregate({
                where: {
                    userId: req.userId,
                    type: 'EXPENSE',
                    deletedAt: null,
                    date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
                    tags: { some: { id: prevBudget.tagId } }
                },
                _sum: { amount: true }
            });

            const spent = spentResult._sum.amount || 0;
            const unused = Math.max(0, prevBudget.limit + prevBudget.rolloverAmount - spent);

            // Create or update current month budget with rollover
            const currentBudget = await prisma.budget.upsert({
                where: {
                    tagId_month_year_userId: {
                        tagId: prevBudget.tagId,
                        month: currentMonth,
                        year: currentYear,
                        userId: req.userId
                    }
                },
                create: {
                    tagId: prevBudget.tagId,
                    limit: prevBudget.limit,
                    rolloverEnabled: true,
                    rolloverAmount: unused,
                    month: currentMonth,
                    year: currentYear,
                    userId: req.userId
                },
                update: {
                    rolloverAmount: unused
                }
            });

            results.push({
                tagId: prevBudget.tagId,
                previousSpent: spent,
                rolledOver: unused,
                newBudgetId: currentBudget.id
            });
        }

        res.json(success(results, `Rollover ejecutado para ${results.length} presupuestos`));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
