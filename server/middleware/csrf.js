/**
 * CSRF Protection Middleware - Double Submit Cookie Pattern
 * 
 * How it works:
 * 1. Server sets csrf_token cookie (non-httpOnly, readable by JS)
 * 2. Frontend reads cookie and sends value in x-csrf-token header
 * 3. This middleware verifies cookie === header
 * 
 * Applied to: POST /auth/refresh, POST /auth/logout
 * 
 * @see implementation_plan.md PR 1
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const ENABLE_CSRF = process.env.FEATURE_CSRF_ENABLED === 'true';

/**
 * Generate and set CSRF token cookie
 * Called on login/register to provide token for subsequent requests
 */
const setCsrfCookie = (res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false, // Frontend needs to read this
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return csrfToken;
};

/**
 * Clear CSRF cookie (on logout)
 */
const clearCsrfCookie = (res) => {
    res.clearCookie(CSRF_COOKIE_NAME);
};

/**
 * Middleware: verifyCsrf
 * Verifies CSRF token from cookie matches header
 */
const verifyCsrf = (req, res, next) => {
    // Skip if CSRF is disabled via feature flag
    if (!ENABLE_CSRF) {
        return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];

    // Both must be present and match
    if (!cookieToken || !headerToken) {
        logger.warn('CSRF validation failed: missing token', {
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken,
            ip: req.ip
        });
        return res.status(403).json({
            success: false,
            error: 'CSRF_REQUIRED',
            message: 'Token CSRF requerido'
        });
    }

    if (cookieToken !== headerToken) {
        logger.warn('CSRF validation failed: token mismatch', { ip: req.ip });
        return res.status(403).json({
            success: false,
            error: 'CSRF_INVALID',
            message: 'Token CSRF inválido'
        });
    }

    next();
};

module.exports = {
    verifyCsrf,
    setCsrfCookie,
    clearCsrfCookie,
    CSRF_COOKIE_NAME,
    ENABLE_CSRF
};
