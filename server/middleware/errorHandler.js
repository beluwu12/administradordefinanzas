/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns standardized responses
 * 
 * IMPORTANT: This must be registered LAST in the middleware chain
 */

const { error, errors } = require('../utils/responseUtils');

/**
 * Error types for classification
 */
class AppError extends Error {
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
        this.isOperational = true; // Distinguishes from programming errors
    }
}

class ValidationError extends AppError {
    constructor(message = 'Datos de entrada inválidos', details = null) {
        super(message, 'VALIDATION_ERROR', 400);
        this.details = details;
    }
}

class AuthError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 'AUTH_ERROR', 401);
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Recurso') {
        super(`${resource} no encontrado`, 'NOT_FOUND', 404);
    }
}

class OwnershipError extends AppError {
    constructor() {
        super('No tienes permiso para acceder a este recurso', 'OWNERSHIP_ERROR', 403);
    }
}

/**
 * Global error handler middleware
 * Log details internally, return generic messages to client
 */
const errorHandler = (err, req, res, next) => {
    // Log full error details for debugging (internal only)
    console.error('═══════════════════════════════════════════════');
    console.error(`[ERROR] ${new Date().toISOString()}`);
    console.error(`[PATH] ${req.method} ${req.path}`);
    console.error(`[USER] ${req.userId || 'Anonymous'}`);
    console.error(`[MESSAGE] ${err.message}`);
    if (err.stack) {
        console.error(`[STACK] ${err.stack}`);
    }
    console.error('═══════════════════════════════════════════════');

    // Handle Prisma errors
    if (err.code) {
        switch (err.code) {
            case 'P2002': // Unique constraint violation
                return res.status(409).json(
                    error('El recurso ya existe', 'DUPLICATE', 409)
                );
            case 'P2025': // Record not found
                return res.status(404).json(
                    error('Recurso no encontrado', 'NOT_FOUND', 404)
                );
            case 'P2003': // Foreign key constraint failed
                return res.status(400).json(
                    error('Referencia inválida', 'INVALID_REFERENCE', 400)
                );
        }
    }

    // Handle known operational errors
    if (err.isOperational) {
        return res.status(err.status).json({
            success: false,
            data: null,
            message: err.message,
            error: err.message,
            code: err.code,
            ...(err.details && { details: err.details })
        });
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        const details = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
        return res.status(400).json({
            success: false,
            data: null,
            message: 'Error de validación',
            error: 'Datos de entrada inválidos',
            code: 'VALIDATION_ERROR',
            details
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json(errors.invalidToken());
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json(
            error('Token expirado', 'TOKEN_EXPIRED', 401)
        );
    }

    // Unknown/programming errors - return generic message
    // NEVER expose internal error details to client
    return res.status(500).json(errors.server());
};

/**
 * 404 Handler for undefined routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json(
        error(`Ruta no encontrada: ${req.method} ${req.path}`, 'ROUTE_NOT_FOUND', 404)
    );
};

module.exports = {
    errorHandler,
    notFoundHandler,
    AppError,
    ValidationError,
    AuthError,
    NotFoundError,
    OwnershipError
};
