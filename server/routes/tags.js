const express = require('express');
const prisma = require('../db');
const requireUser = require('../middleware/auth');
const router = express.Router();

router.use(requireUser);

// GET /api/tags
router.get('/', async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({
            where: { userId: req.userId },
            include: { transactions: true }
        });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching tags' });
    }
});

// POST /api/tags
router.post('/', async (req, res) => {
    const { name, color } = req.body;
    try {
        const tag = await prisma.tag.create({
            data: {
                name,
                color,
                userId: req.userId
            }
        });
        res.json(tag);
    } catch (error) {
        // Handle unique constraint violation specifically if needed
        res.status(500).json({ error: 'Error creating tag' });
    }
});

// DELETE /api/tags/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await prisma.tag.deleteMany({
            where: { id, userId: req.userId }
        });
        if (count.count === 0) return res.status(404).json({ error: 'Not found' });

        res.json({ message: 'Tag deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting tag' });
    }
});

// GET /api/tags/:id/transactions
router.get('/:id/transactions', async (req, res) => {
    const { id } = req.params;
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                tags: { some: { id } }
            },
            include: { tags: true },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transactions for tag' });
    }
});

module.exports = router;
