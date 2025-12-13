/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header and attaches user to request
 * 
 * IMPORTANT: This replaces the old x-user-id based authentication
 * All protected routes should use this middleware
 */

const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { errors } = require('../utils/responseUtils');

// Ensure JWT_SECRET is configured - fail fast if not
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is not set!');
    console.error('   Set it in your .env file: JWT_SECRET=your-secure-secret-here');
    process.exit(1);
}

/**
 * Middleware: requireAuth
 * - Extracts JWT from Authorization: Bearer <token> header
 * - Validates token and checks expiration
 * - Fetches user from DB and attaches to req.user
 * - Also sets req.userId for backward compatibility
 */
const requireAuth = async (req, res, next) => {
    try {
        // Extract token from header
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Fallback: Check for legacy x-user-id header (for backward compatibility during transition)
            const legacyUserId = req.headers['x-user-id'];
            if (legacyUserId) {
                console.warn('[Auth] Using legacy x-user-id header - please migrate to JWT');
                const user = await prisma.user.findUnique({
                    where: { id: legacyUserId },
                    select: { id: true, firstName: true, lastName: true }
                });
                if (user) {
                    req.user = user;
                    req.userId = user.id;
                    return next();
                }
            }

            const errResponse = errors.missingToken();
            return res.status(errResponse.status).json(errResponse);
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            console.error('[Auth] JWT verification failed:', jwtError.message);
            const errResponse = errors.invalidToken();
            return res.status(errResponse.status).json(errResponse);
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, firstName: true, lastName: true }
        });

        if (!user) {
            console.error('[Auth] User not found for token ID:', decoded.id);
            const errResponse = errors.unauthorized();
            return res.status(errResponse.status).json(errResponse);
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id; // Backward compatibility

        next();
    } catch (error) {
        console.error('[Auth] Unexpected error:', error);
        const errResponse = errors.server();
        return res.status(errResponse.status).json(errResponse);
    }
};

/**
 * Helper: verifyOwnership
 * Checks if a resource belongs to the authenticated user
 * 
 * @param {string} resourceUserId - The userId field from the resource
 * @param {string} requestUserId - The authenticated user's ID (req.userId)
 * @returns {boolean} - True if ownership matches
 */
const verifyOwnership = (resourceUserId, requestUserId) => {
    return resourceUserId === requestUserId;
};

/**
 * Middleware factory: requireOwnership
 * Creates a middleware that checks ownership for a specific model
 * 
 * @param {string} model - Prisma model name (e.g., 'transaction', 'goal')
 * @param {string} paramName - URL parameter name for resource ID (default: 'id')
 */
const requireOwnership = (model, paramName = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[paramName];
            if (!resourceId) {
                const errResponse = errors.validation('ID del recurso requerido');
                return res.status(errResponse.status).json(errResponse);
            }

            const resource = await prisma[model].findUnique({
                where: { id: resourceId },
                select: { userId: true }
            });

            if (!resource) {
                const errResponse = errors.notFound();
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(resource.userId, req.userId)) {
                console.warn(`[Auth] Ownership check failed: User ${req.userId} tried to access ${model} ${resourceId}`);
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            next();
        } catch (error) {
            console.error('[Auth] Ownership check error:', error);
            const errResponse = errors.server();
            return res.status(errResponse.status).json(errResponse);
        }
    };
};

module.exports = {
    requireAuth,
    verifyOwnership,
    requireOwnership,
    JWT_SECRET
};
