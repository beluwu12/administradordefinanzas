/**
 * Goal Routes - Savings Goals with Quincena Tracking
 * Updated with validation, ownership checks, and decimal.js for calculations
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const Decimal = require('decimal.js');
const { requireAuth, verifyOwnership } = require('../middleware/requireAuth');
const { success, errors } = require('../utils/responseUtils');
const { createGoalSchema, toggleMonthSchema, idParamSchema, goalIdParamSchema, validate } = require('../schemas');

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
 * POST /api/goals - Create a new goal
 */
router.post('/', validate(createGoalSchema), async (req, res, next) => {
    try {
        const { title, totalCost, monthlyAmount, currency, startDate, description, tag } = req.body;

        const parsedTotalCost = new Decimal(totalCost);
        const parsedMonthlyAmount = new Decimal(monthlyAmount);

        const durationMonths = parsedTotalCost.dividedBy(parsedMonthlyAmount).ceil().toNumber();
        if (durationMonths > 120) {
            const errResponse = errors.validation('La duración del objetivo excede el máximo (120 meses)');
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
 */
router.patch('/:goalId/toggle-month',
    validate(goalIdParamSchema, 'params'),
    validate(toggleMonthSchema),
    async (req, res, next) => {
        try {
            const { goalId } = req.params;
            const { monthId, period, isPaid } = req.body;

            // Verify goal ownership
            const goal = await prisma.goal.findUnique({
                where: { id: goalId },
                select: { userId: true }
            });

            if (!goal) {
                const errResponse = errors.notFound('Objetivo');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(goal.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            // Update the specific quincena
            const dataToUpdate = period === 'q1' ? { isQ1Paid: isPaid } : { isQ2Paid: isPaid };

            const updatedMonth = await prisma.goalMonth.update({
                where: { id: monthId },
                data: dataToUpdate
            });

            // Recalculate savedAmount using decimal.js
            const allMonths = await prisma.goalMonth.findMany({
                where: { goalId }
            });

            const newSavedTotal = allMonths.reduce((sum, m) => {
                const qAmount = new Decimal(m.target).dividedBy(2);
                let monthTotal = new Decimal(0);
                if (m.isQ1Paid) monthTotal = monthTotal.plus(qAmount);
                if (m.isQ2Paid) monthTotal = monthTotal.plus(qAmount);
                return sum.plus(monthTotal);
            }, new Decimal(0));

            await prisma.goal.update({
                where: { id: goalId },
                data: { savedAmount: newSavedTotal.toNumber() }
            });

            res.json(success(updatedMonth, 'Quincena actualizada'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/goals/:id - Delete a goal
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check ownership
            const goal = await prisma.goal.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!goal) {
                const errResponse = errors.notFound('Objetivo');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(goal.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            await prisma.goal.delete({ where: { id } });
            res.json(success({ id }, 'Objetivo eliminado'));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
