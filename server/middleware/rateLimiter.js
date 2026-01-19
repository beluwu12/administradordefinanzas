/**
 * Rate Limiter Middleware
 * 
 * Provides rate limiting for authentication endpoints to prevent brute force attacks.
 * Uses express-rate-limit with configurable windows and limits.
 */

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Check if rate limiting is enabled via feature flag
const isEnabled = process.env.FEATURE_RATE_LIMIT_ENABLED !== 'false';

/**
 * Rate limiter for login/register endpoints
 * - 10 attempts per 15 minutes per IP+email combination
 * - Prevents brute force password attacks
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isEnabled ? 10 : 1000, // 10 attempts if enabled, effectively unlimited if disabled
    message: {
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: 'Demasiados intentos. Espera 15 minutos.'
    },
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    keyGenerator: (req, res) => {
        // Use ipKeyGenerator helper for proper IPv6 handling
        const ip = ipKeyGenerator(req, res);
        // Combine IP + email for more granular limiting
        const email = req.body?.email?.toLowerCase() || 'unknown';
        return `${ip}:${email}`;
    },
    handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded for auth', {
            ip: req.ip,
            email: req.body?.email,
            path: req.path
        });
        res.status(429).json(options.message);
    },
    skip: () => !isEnabled
});

/**
 * Rate limiter for refresh token endpoint
 * - 5 attempts per minute per IP
 * - Prevents rapid token refresh attempts
 */
const refreshLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isEnabled ? 5 : 1000,
    message: {
        success: false,
        error: 'TOO_MANY_REFRESH',
        message: 'Demasiados refreshes. Espera un momento.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded for refresh', { ip: req.ip });
        res.status(429).json(options.message);
    },
    skip: () => !isEnabled
});

/**
 * General API rate limiter
 * - 100 requests per minute per IP
 * - Prevents API abuse
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isEnabled ? 100 : 10000,
    message: {
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas solicitudes. Espera un momento.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isEnabled
});

module.exports = {
    authLimiter,
    refreshLimiter,
    apiLimiter,
    isRateLimitEnabled: isEnabled
};
