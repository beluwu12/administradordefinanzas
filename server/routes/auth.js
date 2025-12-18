const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema, validate } = require('../schemas');
const { getDefaultCurrency, getDefaultTimezone } = require('../config/countries');

// Helper: Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper: Format user response (consistent across endpoints)
const formatUserResponse = (user, token = null) => {
    const response = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        defaultCurrency: user.defaultCurrency,
        timezone: user.timezone
    };
    if (token) {
        response.token = token;
    }
    return response;
};

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { email, password, firstName, lastName, country } = req.body;

        // Check if user exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'El email ya está registrado' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Get defaults for country
        const defaultCurrency = getDefaultCurrency(country);
        const timezone = getDefaultTimezone(country);

        // Create user with multi-country support
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                country,
                defaultCurrency,
                timezone
            }
        });

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            data: formatUserResponse(user, token)
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            data: formatUserResponse(user, token)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                country: true,
                defaultCurrency: true,
                timezone: true
            }
        });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Token inválido' });
    }
});

module.exports = router;

