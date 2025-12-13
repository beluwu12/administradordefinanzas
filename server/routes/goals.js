const express = require('express');
const router = express.Router();
const prisma = require('../db'); // Singleton instance
const requireUser = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(requireUser);

// GET /api/goals - List all goals for the user
router.get('/', async (req, res) => {
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
        res.json(goals);
    } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ error: "Failed to fetch goals" });
    }
});

// POST /api/goals - Create a new goal
router.post('/', async (req, res) => {
    const { title, totalCost, monthlyAmount, currency, startDate, description, tag } = req.body;

    if (!title || !totalCost || !monthlyAmount) {
        return res.status(400).json({ error: "Title, Total Cost, and Monthly Amount are required" });
    }

    // Validation
    const parsedTotalCost = parseFloat(totalCost);
    const parsedMonthlyAmount = parseFloat(monthlyAmount);

    if (isNaN(parsedTotalCost) || parsedTotalCost <= 0) {
        return res.status(400).json({ error: "Total Cost must be a positive number" });
    }
    if (isNaN(parsedMonthlyAmount) || parsedMonthlyAmount <= 0) {
        return res.status(400).json({ error: "Monthly Amount must be a positive number" });
    }
    if (parsedMonthlyAmount > parsedTotalCost) {
        return res.status(400).json({ error: "Monthly Amount cannot be greater than Total Cost" });
    }
    if (currency && !['USD', 'VES'].includes(currency)) {
        return res.status(400).json({ error: "Currency must be USD or VES" });
    }

    try {
        const actualStartDate = startDate ? new Date(startDate) : new Date();
        if (isNaN(actualStartDate.getTime())) {
            return res.status(400).json({ error: "Invalid start date" });
        }

        const durationMonths = Math.ceil(parsedTotalCost / parsedMonthlyAmount);
        if (durationMonths > 120) { // Reasonable limit
            return res.status(400).json({ error: "Goal duration exceeds maximum (120 months)" });
        }

        // Calculate deadline
        const deadline = new Date(actualStartDate);
        deadline.setMonth(deadline.getMonth() + durationMonths);

        // Generate GoalMonth entries
        const progressData = [];
        let remaining = parsedTotalCost;

        for (let i = 1; i <= durationMonths; i++) {
            const target = (remaining < parsedMonthlyAmount) ? remaining : parsedMonthlyAmount;
            progressData.push({
                monthIndex: i,
                target: parseFloat(target.toFixed(2))
            });
            remaining -= target;
        }

        const goal = await prisma.goal.create({
            data: {
                userId: req.userId,
                title: title.trim(),
                description: description ? description.trim() : null,
                totalCost: parsedTotalCost,
                monthlyAmount: parsedMonthlyAmount,
                currency: currency || 'USD',
                startDate: actualStartDate,
                deadline,
                durationMonths,
                tag: tag ? tag.trim() : null,
                progress: {
                    create: progressData
                }
            },
            include: {
                progress: true
            }
        });

        res.status(201).json(goal);
    } catch (error) {
        console.error("Error creating goal:", error);
        res.status(500).json({ error: "Failed to create goal" });
    }
});

// PATCH /api/goals/:goalId/toggle-month - Toggle completion of a month
router.patch('/:goalId/toggle-month', async (req, res) => {
    const { goalId } = req.params;
    const { monthId, isCompleted } = req.body;

    if (!monthId) {
        return res.status(400).json({ error: "monthId is required" });
    }
    if (typeof isCompleted !== 'boolean') {
        return res.status(400).json({ error: "isCompleted must be a boolean" });
    }

    try {
        // Verify ownership
        const goal = await prisma.goal.findUnique({
            where: { id: goalId },
            select: { userId: true }
        });

        if (!goal || goal.userId !== req.userId) {
            return res.status(404).json({ error: "Goal not found" });
        }

        // Verify month belongs to goal
        const month = await prisma.goalMonth.findFirst({
            where: { id: monthId, goalId: goalId }
        });

        if (!month) {
            return res.status(404).json({ error: "Month not found for this goal" });
        }

        const updatedMonth = await prisma.goalMonth.update({
            where: { id: monthId },
            data: { isCompleted }
        });

        // Update main goal savedAmount (sum of all completed months)
        const allMonths = await prisma.goalMonth.findMany({
            where: { goalId: goalId, isCompleted: true }
        });

        const newSavedTotal = allMonths.reduce((sum, m) => sum + m.target, 0);

        await prisma.goal.update({
            where: { id: goalId },
            data: { savedAmount: newSavedTotal }
        });

        res.json(updatedMonth);
    } catch (error) {
        console.error("Error updating goal progress:", error);
        res.status(500).json({ error: "Failed to update progress" });
    }
});

// DELETE /api/goals/:id - Delete a goal
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership and delete
        const goal = await prisma.goal.findFirst({
            where: { id, userId: req.userId }
        });

        if (!goal) {
            return res.status(404).json({ error: "Goal not found" });
        }

        await prisma.goal.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting goal:", error);
        res.status(500).json({ error: "Failed to delete goal" });
    }
});

module.exports = router;
