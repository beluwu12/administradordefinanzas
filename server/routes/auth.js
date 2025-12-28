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
const crypto = require('crypto');
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema, validate } = require('../schemas');
const { getDefaultCurrency, getDefaultTimezone } = require('../config/countries');
const { AUTH } = require('../config/constants');
const { success, errors } = require('../utils/responseUtils');
const { logger } = require('../utils/logger');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { verifyCsrf, setCsrfCookie, clearCsrfCookie } = require('../middleware/csrf');

// ═══════════════════════════════════════════════════════════════
// TOKEN CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const ACCESS_TOKEN_EXPIRY = '15m';      // Short-lived
const REFRESH_TOKEN_EXPIRY = '7d';       // Longer-lived
const REFRESH_COOKIE_NAME = 'finance_refresh_token';
const ENABLE_TOKEN_ROTATION = process.env.FEATURE_ROTATE_REFRESH !== 'false';

// ═══════════════════════════════════════════════════════════════
// SESSION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Hash a token using SHA-256 for secure storage
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create a session record for the refresh token
 */
const createSession = async (userId, refreshToken, req) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return prisma.session.create({
        data: {
            tokenHash: hashToken(refreshToken),
            userId,
            userAgent: req.headers['user-agent']?.substring(0, 500) || null,
            ipAddress: req.ip || null,
            expiresAt
        }
    });
};

/**
 * Revoke a session by its token hash
 */
const revokeSession = async (tokenHash) => {
    return prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() }
    });
};

/**
 * Revoke all sessions for a user (used when token reuse is detected)
 */
const revokeAllUserSessions = async (userId) => {
    return prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
    });
};

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
 * For cross-site (frontend on different domain): sameSite=none + secure=true
 */
const setRefreshTokenCookie = (res, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    // Cross-site requires SameSite=None and Secure=true
    const sameSite = isProduction ? 'none' : 'lax';

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: isProduction, // Required for SameSite=None
        sameSite: sameSite,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });
};

/**
 * Format user response (consistent across endpoints)
 * NOTE: refreshToken is NOT included - it's only set via httpOnly cookie
 */
const formatUserResponse = (user, accessToken = null) => {
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
    // refreshToken intentionally NOT included in response body
    // It is only set via httpOnly cookie for security
    return response;
};

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/register - Create new account
 */
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
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

        // Create session record for token rotation tracking
        if (ENABLE_TOKEN_ROTATION) {
            await createSession(user.id, refreshToken, req);
        }

        // Set refresh token in cookie
        setRefreshTokenCookie(res, refreshToken);

        // Set CSRF token for subsequent requests (cross-site protection)
        setCsrfCookie(res);

        logger.info('User registered', { userId: user.id, email: user.email });

        res.status(201).json({
            success: true,
            data: formatUserResponse(user, accessToken)
        });
    } catch (error) {
        console.error('[REGISTER ERROR]', error);
        logger.error('Register error', { error: error.message });
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

/**
 * POST /api/auth/login - Authenticate user
 */
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
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

        // Create session record for token rotation tracking
        if (ENABLE_TOKEN_ROTATION) {
            await createSession(user.id, refreshToken, req);
        }

        setRefreshTokenCookie(res, refreshToken);

        // Set CSRF token for subsequent requests (cross-site protection)
        setCsrfCookie(res);

        logger.info('User logged in', { userId: user.id });

        res.json({
            success: true,
            data: formatUserResponse(user, accessToken)
        });
    } catch (error) {
        console.error('[LOGIN ERROR]', error);
        logger.error('Login error', { error: error.message });
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

/**
 * POST /api/auth/refresh - Get new access token using refresh token
 * 
 * Client should call this when access token expires (401 response)
 * CSRF protection: requires x-csrf-token header matching csrf_token cookie
 */
router.post('/refresh', refreshLimiter, verifyCsrf, async (req, res) => {
    try {
        // Get refresh token from cookie ONLY (not from body for security)
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

        if (!refreshToken) {
            logger.warn('Refresh attempt without cookie', { ip: req.ip });
            return res.status(401).json({
                success: false,
                error: 'REFRESH_TOKEN_MISSING',
                message: 'No se encontró token de refresco. Inicia sesión nuevamente.'
            });
        }

        // Verify refresh token JWT
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

        // If token rotation is enabled, verify session exists and is not revoked
        if (ENABLE_TOKEN_ROTATION) {
            const tokenHash = hashToken(refreshToken);
            const session = await prisma.session.findUnique({
                where: { tokenHash },
                include: { user: true }
            });

            // Token not found in sessions
            if (!session) {
                logger.warn('Refresh token not found in sessions', { userId: decoded.id, ip: req.ip });
                return res.status(401).json(errors.invalidToken());
            }

            // TOKEN REUSE DETECTED - session was already revoked
            if (session.revokedAt) {
                logger.error('TOKEN REUSE DETECTED! Revoking all user sessions', {
                    userId: session.userId,
                    sessionId: session.id,
                    originalRevokedAt: session.revokedAt,
                    ip: req.ip
                });

                // Security: Revoke ALL sessions for this user
                await revokeAllUserSessions(session.userId);

                // Clear the cookie
                res.clearCookie(REFRESH_COOKIE_NAME);

                return res.status(401).json({
                    success: false,
                    error: 'SESSION_COMPROMISED',
                    message: 'Sesión comprometida. Por seguridad, inicia sesión nuevamente.'
                });
            }

            // Check if session is expired
            if (session.expiresAt < new Date()) {
                await revokeSession(tokenHash);
                return res.status(401).json({
                    success: false,
                    error: 'SESSION_EXPIRED',
                    message: 'Sesión expirada. Inicia sesión nuevamente.'
                });
            }

            // Generate new tokens
            const newAccessToken = generateAccessToken(session.userId);
            const newRefreshToken = generateRefreshToken(session.userId);

            // Revoke old session
            await revokeSession(tokenHash);

            // Create new session
            await createSession(session.userId, newRefreshToken, req);

            // Set new cookie
            setRefreshTokenCookie(res, newRefreshToken);

            logger.info('Token rotated', { userId: session.userId });

            return res.json(success({
                token: newAccessToken,
                expiresIn: 15 * 60,
                user: formatUserResponse(session.user)
            }));
        }

        // Fallback: No rotation enabled, just verify user exists
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

        // Generate new access token only
        const newAccessToken = generateAccessToken(user.id);

        logger.info('Token refreshed (no rotation)', { userId: user.id });

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
 * POST /api/auth/logout - Clear refresh token and revoke session
 * CSRF protection: requires x-csrf-token header matching csrf_token cookie
 */
router.post('/logout', verifyCsrf, async (req, res) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

        // Revoke session in database if token rotation is enabled
        if (refreshToken && ENABLE_TOKEN_ROTATION) {
            const tokenHash = hashToken(refreshToken);
            await revokeSession(tokenHash);
            logger.info('Session revoked on logout');
        }

        res.clearCookie(REFRESH_COOKIE_NAME);
        clearCsrfCookie(res);
        res.json(success({ message: 'Sesión cerrada' }));
    } catch (error) {
        // Still clear cookies even if DB operation fails
        res.clearCookie(REFRESH_COOKIE_NAME);
        clearCsrfCookie(res);
        res.json(success({ message: 'Sesión cerrada' }));
    }
});

/**
 * PUT /api/auth/profile - Update user profile (name)
 */
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { firstName, lastName, timezone } = req.body;

        // Validate input
        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, error: 'Nombre y apellido son requeridos' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: decoded.id },
            data: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                ...(timezone && { timezone })
            },
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

        logger.info('User profile updated', { userId: decoded.id });
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        logger.error('Profile update error', { error: error.message });
        res.status(500).json({ success: false, error: 'Error actualizando perfil' });
    }
});

/**
 * PUT /api/auth/password - Change password
 */
router.put('/password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Contraseñas requeridas' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Contraseña actual incorrecta' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(AUTH.BCRYPT_SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword }
        });

        logger.info('User password changed', { userId: decoded.id });
        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        logger.error('Password change error', { error: error.message });
        res.status(500).json({ success: false, error: 'Error cambiando contraseña' });
    }
});

/**
 * DELETE /api/auth/account - Delete user account and all data
 */
router.delete('/account', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { password } = req.body;

        // Require password confirmation
        if (!password) {
            return res.status(400).json({ success: false, error: 'Contraseña requerida para confirmar' });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Contraseña incorrecta' });
        }

        // Delete user (cascade will delete related data due to onDelete: Cascade in schema)
        await prisma.user.delete({
            where: { id: decoded.id }
        });

        // Clear refresh token cookie
        res.clearCookie(REFRESH_COOKIE_NAME);

        logger.info('User account deleted', { userId: decoded.id, email: user.email });
        res.json({ success: true, message: 'Cuenta eliminada exitosamente' });
    } catch (error) {
        logger.error('Account deletion error', { error: error.message });
        res.status(500).json({ success: false, error: 'Error eliminando cuenta' });
    }
});

module.exports = router;
