/**
 * User Routes - Authentication and User Management
 * Updated with Zod validation and standardized responses
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { success, errors } = require('../utils/responseUtils');
const { createUserSchema, verifyPinSchema, validate } = require('../schemas');

// Get JWT_SECRET - must be set in environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET not set in environment!');
    process.exit(1);
}

/**
 * POST /api/users - Create new user
 * Validates: firstName, lastName, pin (4 digits)
 */
router.post('/', validate(createUserSchema), async (req, res, next) => {
    try {
        const { firstName, lastName, pin } = req.body;

        const hashedPin = await bcrypt.hash(pin, 10);
        const user = await prisma.user.create({
            data: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                pin: hashedPin
            }
        });

        // Return without PIN
        const { pin: _, ...userWithoutPin } = user;
        res.status(201).json(success(userWithoutPin, 'Usuario creado exitosamente'));
    } catch (error) {
        // Let global error handler process Prisma errors
        next(error);
    }
});

/**
 * GET /api/users - List all users (for selection screen)
 * Public endpoint - no auth required
 */
router.get('/', async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(success(users));
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users/verify - Verify PIN and get JWT token
 * Validates: userId (UUID), pin
 */
router.post('/verify', validate(verifyPinSchema), async (req, res, next) => {
    const { userId, pin } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            const errResponse = errors.notFound('Usuario');
            return res.status(errResponse.status).json(errResponse);
        }

        const isValid = await bcrypt.compare(pin, user.pin);
        if (!isValid) {
            // Log internally for security monitoring
            console.warn(`[Auth] Failed PIN attempt for user: ${userId}`);
            const errResponse = errors.unauthorized();
            errResponse.message = 'PIN incorrecto';
            return res.status(401).json(errResponse);
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json(success({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName
            },
            token
        }, 'Autenticación exitosa'));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
