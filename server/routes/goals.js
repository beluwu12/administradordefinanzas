/**
 * Goal Routes - Savings Goals with Quincena Tracking
 * 
 * FIXED:
 * - Race condition in toggle-month using Prisma transaction
 * - Uses constants for magic numbers
 * - Consistent error handling
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const Decimal = require('decimal.js');
const { requireAuth, requireOwnership } = require('../middleware/requireAuth');
const { success, errors } = require('../utils/responseUtils');
const { createGoalSchema, toggleMonthSchema, idParamSchema, goalIdParamSchema, validate } = require('../schemas');
const { GOALS } = require('../config/constants');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/goals - List all goals for user
 */
router.get('/', async (req, res, next) => {
    try {
        const goals = await prisma.goal.findMany({
            where: { userId: req.userId },
            include: {
                progress: {
                    orderBy: { monthIndex: 'asc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(success(goals));
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/goals/:id - Get single goal detail
 */
router.get('/:id',
    validate(idParamSchema, 'params'),
    requireOwnership('goal'),
    async (req, res, next) => {
        try {
            const goal = await prisma.goal.findUnique({
                where: { id: req.params.id },
                include: {
                    progress: {
                        orderBy: { monthIndex: 'asc' }
                    }
                }
            });
            res.json(success(goal));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/goals - Create a new goal
 */
router.post('/', validate(createGoalSchema), async (req, res, next) => {
    try {
        const { title, totalCost, monthlyAmount, currency, startDate, description, tag } = req.body;

        const parsedTotalCost = new Decimal(totalCost);
        const parsedMonthlyAmount = new Decimal(monthlyAmount);

        const durationMonths = parsedTotalCost.dividedBy(parsedMonthlyAmount).ceil().toNumber();

        if (durationMonths > GOALS.MAX_DURATION_MONTHS) {
            const errResponse = errors.validation(
                `La duración del objetivo excede el máximo (${GOALS.MAX_DURATION_MONTHS} meses / ${GOALS.MAX_DURATION_MONTHS / 12} años)`
            );
            return res.status(errResponse.status).json(errResponse);
        }

        const actualStartDate = startDate ? new Date(startDate) : new Date();
        const deadline = new Date(actualStartDate);
        deadline.setMonth(deadline.getMonth() + durationMonths);

        // Generate GoalMonth entries with decimal precision
        const progressData = [];
        let remaining = parsedTotalCost;

        for (let i = 1; i <= durationMonths; i++) {
            const target = Decimal.min(remaining, parsedMonthlyAmount);
            progressData.push({
                monthIndex: i,
                target: target.toNumber()
            });
            remaining = remaining.minus(target);
        }

        const goal = await prisma.goal.create({
            data: {
                userId: req.userId,
                title: title.trim(),
                description: description?.trim() || null,
                totalCost: parsedTotalCost.toNumber(),
                monthlyAmount: parsedMonthlyAmount.toNumber(),
                currency: currency || 'USD',
                startDate: actualStartDate,
                deadline,
                durationMonths,
                tag: tag?.trim() || null,
                progress: {
                    create: progressData
                }
            },
            include: { progress: true }
        });

        res.status(201).json(success(goal, 'Objetivo creado'));
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/goals/:goalId/toggle-month - Toggle quincena payment
 * 
 * CRITICAL FIX: Uses Prisma transaction to prevent race conditions
 * When multiple requests come in simultaneously, they are serialized
 */
router.patch('/:goalId/toggle-month',
    validate(goalIdParamSchema, 'params'),
    validate(toggleMonthSchema),
    requireOwnership('goal', 'goalId'),
    async (req, res, next) => {
        try {
            const { goalId } = req.params;
            const { monthId, period, isPaid } = req.body;

            // Use Prisma transaction to prevent race conditions
            const result = await prisma.$transaction(async (tx) => {
                // Verify the month belongs to this goal
                const month = await tx.goalMonth.findUnique({
                    where: { id: monthId },
                    select: { goalId: true }
                });

                if (!month || month.goalId !== goalId) {
                    throw new Error('MONTH_NOT_FOUND');
                }

                // Update the specific quincena
                const dataToUpdate = period === 'q1'
                    ? { isQ1Paid: isPaid }
                    : { isQ2Paid: isPaid };

                const updatedMonth = await tx.goalMonth.update({
                    where: { id: monthId },
                    data: dataToUpdate
                });

                // Recalculate savedAmount atomically within the same transaction
                const allMonths = await tx.goalMonth.findMany({
                    where: { goalId }
                });

                const newSavedTotal = allMonths.reduce((sum, m) => {
                    const qAmount = new Decimal(m.target).dividedBy(2);
                    let monthTotal = new Decimal(0);

                    // Use updated values for the month we just changed
                    const isQ1 = m.id === monthId ? (period === 'q1' ? isPaid : m.isQ1Paid) : m.isQ1Paid;
                    const isQ2 = m.id === monthId ? (period === 'q2' ? isPaid : m.isQ2Paid) : m.isQ2Paid;

                    if (isQ1) monthTotal = monthTotal.plus(qAmount);
                    if (isQ2) monthTotal = monthTotal.plus(qAmount);

                    return sum.plus(monthTotal);
                }, new Decimal(0));

                await tx.goal.update({
                    where: { id: goalId },
                    data: { savedAmount: newSavedTotal.toNumber() }
                });

                return updatedMonth;
            });

            res.json(success(result, 'Quincena actualizada'));
        } catch (error) {
            if (error.message === 'MONTH_NOT_FOUND') {
                const errResponse = errors.notFound('Mes del objetivo');
                return res.status(errResponse.status).json(errResponse);
            }
            next(error);
        }
    }
);

/**
 * DELETE /api/goals/:id - Delete a goal
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    requireOwnership('goal'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Delete goal (cascade will handle progress and contributions)
            await prisma.goal.delete({ where: { id } });

            res.json(success({ id }, 'Objetivo eliminado'));
        } catch (error) {
            next(error);
        }
    }
);

// ═══════════════════════════════════════════════════════════════
// GOAL CONTRIBUTIONS (New endpoints for Lovable UI)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/goals/:goalId/contributions - List all contributions for a goal
 */
router.get('/:goalId/contributions',
    validate(goalIdParamSchema, 'params'),
    requireOwnership('goal', 'goalId'),
    async (req, res, next) => {
        try {
            const { goalId } = req.params;

            const contributions = await prisma.goalContribution.findMany({
                where: { goalId },
                orderBy: { date: 'desc' }
            });

            res.json(success(contributions));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/goals/:goalId/contributions - Add a new contribution to a goal
 */
router.post('/:goalId/contributions',
    validate(goalIdParamSchema, 'params'),
    requireOwnership('goal', 'goalId'),
    async (req, res, next) => {
        try {
            const { goalId } = req.params;
            const { amount, note, date } = req.body;

            if (!amount || amount <= 0) {
                const errResponse = errors.validation('El monto debe ser mayor a 0');
                return res.status(errResponse.status).json(errResponse);
            }

            const parsedAmount = new Decimal(amount);

            // Use transaction to update savedAmount atomically
            const result = await prisma.$transaction(async (tx) => {
                // Create contribution
                const contribution = await tx.goalContribution.create({
                    data: {
                        goalId,
                        amount: parsedAmount.toNumber(),
                        note: note?.trim() || null,
                        date: date ? new Date(date) : new Date()
                    }
                });

                // Update goal's savedAmount
                const goal = await tx.goal.findUnique({
                    where: { id: goalId },
                    select: { savedAmount: true, totalCost: true }
                });

                const newSavedAmount = new Decimal(goal.savedAmount).plus(parsedAmount);

                // Cap at totalCost
                const cappedAmount = Decimal.min(newSavedAmount, goal.totalCost);

                await tx.goal.update({
                    where: { id: goalId },
                    data: { savedAmount: cappedAmount.toNumber() }
                });

                return contribution;
            });

            res.status(201).json(success(result, 'Contribución agregada'));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
