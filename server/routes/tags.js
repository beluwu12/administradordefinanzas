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

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: '[Tags] El nombre es requerido' });
    }

    try {
        const tag = await prisma.tag.create({
            data: {
                name: name.trim(),
                color: color || 'blue',
                userId: req.userId
            }
        });
        res.json(tag);
    } catch (error) {
        console.error("[Tags POST] Error:", error);
        // Check for unique constraint violation (Prisma error code P2002)
        if (error.code === 'P2002') {
            return res.status(409).json({ error: `[Tags] Ya existe una etiqueta con el nombre "${name}"` });
        }
        res.status(500).json({ error: `[Tags] Error creando etiqueta: ${error.message}` });
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
