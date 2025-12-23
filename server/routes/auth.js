/**
 * Auth Routes - Authentication with Token Refresh
 * 
 * TOKEN STRATEGY:
 * - Access Token: 15 minutes (short-lived for security)
 * - Refresh Token: 7 days (stored in httpOnly cookie for better security)
 * 
 * This provides better security than a single 30-day token.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema, validate } = require('../schemas');
const { getDefaultCurrency, getDefaultTimezone } = require('../config/countries');
const { AUTH } = require('../config/constants');
const { success, errors } = require('../utils/responseUtils');
const { logger } = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════
// TOKEN CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const ACCESS_TOKEN_EXPIRY = '15m';      // Short-lived
const REFRESH_TOKEN_EXPIRY = '7d';       // Longer-lived
const REFRESH_COOKIE_NAME = 'finance_refresh_token';

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

/**
 * Generate refresh token (longer-lived)
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

/**
 * Set refresh token in httpOnly cookie
 */
const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });
};

/**
 * Format user response (consistent across endpoints)
 */
const formatUserResponse = (user, accessToken = null, refreshToken = null) => {
    const response = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        defaultCurrency: user.defaultCurrency,
        timezone: user.timezone
    };
    if (accessToken) {
        response.token = accessToken;
        response.expiresIn = 15 * 60; // 15 minutes in seconds
    }
    if (refreshToken) {
        response.refreshToken = refreshToken;
    }
    return response;
};

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/register - Create new account
 */
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { email, password, firstName, lastName, country } = req.body;

        // Check if user exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'El email ya está registrado' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(AUTH.BCRYPT_SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Get defaults for country
        const defaultCurrency = getDefaultCurrency(country);
        const timezone = getDefaultTimezone(country);

        // Create user
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

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Set refresh token in cookie
        setRefreshTokenCookie(res, refreshToken);

        logger.info('User registered', { userId: user.id, email: user.email });

        res.status(201).json({
            success: true,
            data: formatUserResponse(user, accessToken, refreshToken)
        });
    } catch (error) {
        logger.error('Register error', { error: error.message });
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

/**
 * POST /api/auth/login - Authenticate user
 */
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        setRefreshTokenCookie(res, refreshToken);

        logger.info('User logged in', { userId: user.id });

        res.json({
            success: true,
            data: formatUserResponse(user, accessToken, refreshToken)
        });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

/**
 * POST /api/auth/refresh - Get new access token using refresh token
 * 
 * Client should call this when access token expires (401 response)
 */
router.post('/refresh', async (req, res) => {
    try {
        // Get refresh token from cookie or body
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json(errors.missingToken());
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (err) {
            logger.warn('Invalid refresh token', { error: err.message });
            return res.status(401).json(errors.invalidToken());
        }

        // Ensure it's a refresh token
        if (decoded.type !== 'refresh') {
            return res.status(401).json(errors.invalidToken());
        }

        // Check user still exists
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
            return res.status(401).json(errors.unauthorized());
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user.id);

        // Optionally rotate refresh token (more secure but requires client update)
        // const newRefreshToken = generateRefreshToken(user.id);
        // setRefreshTokenCookie(res, newRefreshToken);

        logger.info('Token refreshed', { userId: user.id });

        res.json(success({
            token: newAccessToken,
            expiresIn: 15 * 60,
            user
        }));
    } catch (error) {
        logger.error('Refresh error', { error: error.message });
        res.status(500).json(errors.server());
    }
});

/**
 * GET /api/auth/me - Get current user profile
 */
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

/**
 * POST /api/auth/logout - Clear refresh token
 */
router.post('/logout', (req, res) => {
    res.clearCookie(REFRESH_COOKIE_NAME);
    res.json(success({ message: 'Sesión cerrada' }));
});

module.exports = router;
