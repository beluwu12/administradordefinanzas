/**
 * Response Utilities - Standardized API responses
 * All endpoints should use these helpers for consistent response format
 */

/**
 * Success response format
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 */
const success = (data, message = null) => ({
    success: true,
    data,
    message,
    error: null,
    code: null
});

/**
 * Error response format
 * @param {string} message - User-friendly error message (NO internal details)
 * @param {string} code - Error code for frontend handling
 * @param {number} status - HTTP status code
 */
const error = (message, code = 'ERROR', status = 500) => ({
    success: false,
    data: null,
    message,
    error: message,
    code,
    status
});

// Pre-defined error responses for common cases
const errors = {
    unauthorized: () => error('No autorizado', 'UNAUTHORIZED', 401),
    forbidden: () => error('Acceso denegado', 'FORBIDDEN', 403),
    notFound: (resource = 'Recurso') => error(`${resource} no encontrado`, 'NOT_FOUND', 404),
    validation: (msg = 'Datos inválidos') => error(msg, 'VALIDATION_ERROR', 400),
    conflict: (msg = 'El recurso ya existe') => error(msg, 'CONFLICT', 409),
    server: () => error('Error interno del servidor', 'SERVER_ERROR', 500),
    invalidToken: () => error('Token inválido o expirado', 'INVALID_TOKEN', 401),
    missingToken: () => error('Token de autenticación requerido', 'MISSING_TOKEN', 401),
    ownershipFailed: () => error('No tienes permiso para acceder a este recurso', 'OWNERSHIP_FAILED', 403),
    rateLimited: () => error('Demasiadas solicitudes, intenta más tarde', 'RATE_LIMITED', 429)
};

module.exports = {
    success,
    error,
    errors
};
