/**
 * Request Logger Middleware
 * 
 * Logs all API requests with:
 * - Method, route, status code, duration
 * - User ID (if authenticated)
 * - Correlation ID (x-request-id) for frontend↔backend tracing
 * - Request body for mutating methods (truncated)
 * - Color-coded output by status
 */

const { logger } = require('../utils/logger');

const MAX_BODY_LOG_LENGTH = 500;

/**
 * Truncate and sanitize body for logging
 * Removes sensitive fields like passwords
 */
const sanitizeBody = (body) => {
    if (!body || typeof body !== 'object') return null;

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken'];
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***';
        }
    }

    const str = JSON.stringify(sanitized);
    if (str.length > MAX_BODY_LOG_LENGTH) {
        return str.substring(0, MAX_BODY_LOG_LENGTH) + '...(truncated)';
    }
    return sanitized;
};

/**
 * Extract user ID from JWT token without full verification
 * Used only for logging — actual auth is done by requireAuth middleware
 */
const extractUserId = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) return null;

        const token = authHeader.split(' ')[1];
        // Decode payload without verification (just for logging)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload.id || null;
    } catch {
        return null;
    }
};

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const requestId = req.headers['x-request-id'] || `srv-${Date.now().toString(36)}`;

    // Attach requestId to response headers for correlation
    res.setHeader('x-request-id', requestId);

    // Capture the original end function to intercept response
    const originalEnd = res.end;

    res.end = function (...args) {
        const duration = Number(process.hrtime.bigint() - startTime) / 1e6; // ms
        const statusCode = res.statusCode;
        const userId = extractUserId(req);

        // Build log entry
        const logEntry = {
            requestId,
            method: req.method,
            path: req.originalUrl || req.url,
            status: statusCode,
            duration: `${duration.toFixed(1)}ms`,
            userId: userId || 'anon',
            ip: req.ip,
        };

        // Add body for mutating methods
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body) {
            logEntry.body = sanitizeBody(req.body);
        }

        // Log at appropriate level based on status
        if (statusCode >= 500) {
            logger.error('API Request', logEntry);
        } else if (statusCode >= 400) {
            logger.warn('API Request', logEntry);
        } else {
            logger.info('API Request', logEntry);
        }

        // Console output with color coding for development
        if (process.env.NODE_ENV === 'development') {
            const statusColor =
                statusCode >= 500 ? '\x1b[31m' :  // Red
                statusCode >= 400 ? '\x1b[33m' :  // Yellow
                statusCode >= 300 ? '\x1b[36m' :  // Cyan
                '\x1b[32m';                        // Green
            const reset = '\x1b[0m';
            const dim = '\x1b[2m';

            const methodPad = req.method.padEnd(6);
            const durationPad = `${duration.toFixed(0)}ms`.padStart(7);
            const userStr = userId ? ` [${userId.substring(0, 8)}]` : '';

            console.log(
                `${dim}[API]${reset} ${methodPad} ${statusColor}${statusCode}${reset} ${durationPad} ${req.originalUrl || req.url}${dim}${userStr}${reset}`
            );
        }

        // Call original end
        return originalEnd.apply(this, args);
    };

    next();
};

module.exports = { requestLogger };
