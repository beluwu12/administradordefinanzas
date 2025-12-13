const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/users - Create new user
router.post('/', async (req, res) => {
    const { firstName, lastName, pin } = req.body;

    if (!firstName || !lastName || !pin) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (pin.length !== 4 || isNaN(pin)) {
        return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos numéricos' });
    }

    try {
        const hashedPin = await bcrypt.hash(pin, 10);
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                pin: hashedPin
            }
        });

        // Return without PIN
        const { pin: _, ...userWithoutPin } = user;
        res.json(userWithoutPin);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// GET /api/users - List users (for selection screen)
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                // Do NOT select PIN
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// POST /api/users/verify - Verify PIN
router.post('/verify', async (req, res) => {
    const { userId, pin } = req.body;

    if (!userId || !pin) {
        return res.status(400).json({ error: 'User ID y PIN requeridos' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isValid = await bcrypt.compare(pin, user.pin);
        if (isValid) {
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET || 'fallback_secret', // Best practice: Use env var
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
                token
            });
        } else {
            res.status(401).json({ error: 'PIN incorrecto' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error de autenticación' });
    }
});

module.exports = router;
