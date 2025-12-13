/**
 * Centralized API Module
 * - Axios instance with base configuration
 * - Automatic JWT token attachment via interceptor
 * - Standardized error handling
 * - Response unwrapping
 */

import axios from 'axios';
import API_URL from './config';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR - Attach JWT token to all requests
// ═══════════════════════════════════════════════════════════════

api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('finance_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Also send x-user-id for backward compatibility during transition
        const storedUser = localStorage.getItem('finance_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                config.headers['x-user-id'] = user.id;
            } catch (e) {
                console.warn('[API] Could not parse stored user');
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR - Handle common errors and unwrap responses
// ═══════════════════════════════════════════════════════════════

api.interceptors.response.use(
    (response) => {
        // Unwrap standardized response format
        // Backend returns: { success, data, message, error, code }
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
            if (response.data.success) {
                // Return the data part directly for convenience
                response.data = response.data.data;
            }
        }
        return response;
    },
    (error) => {
        // Handle different error types
        if (error.response) {
            const { status, data } = error.response;

            // Create a user-friendly error object
            const apiError = {
                status,
                code: data?.code || 'ERROR',
                message: getErrorMessage(status, data),
                original: error
            };

            // Handle token expiration
            if (status === 401 && data?.code === 'INVALID_TOKEN') {
                // Clear auth data and redirect to login
                localStorage.removeItem('finance_token');
                localStorage.removeItem('finance_user');
                window.location.href = '/';
            }

            return Promise.reject(apiError);
        }

        // Network or timeout errors
        if (error.code === 'ECONNABORTED') {
            return Promise.reject({
                status: 0,
                code: 'TIMEOUT',
                message: 'La solicitud tardó demasiado. Verifica tu conexión.',
                original: error
            });
        }

        return Promise.reject({
            status: 0,
            code: 'NETWORK_ERROR',
            message: 'Error de conexión. Verifica tu internet.',
            original: error
        });
    }
);

/**
 * Get user-friendly error message based on status and response
 */
function getErrorMessage(status, data) {
    // If backend provided a message, use it (already sanitized)
    if (data?.message) {
        return data.message;
    }

    // Fallback messages by status code
    switch (status) {
        case 400:
            return 'Datos inválidos. Revisa los campos.';
        case 401:
            return 'Sesión expirada. Inicia sesión nuevamente.';
        case 403:
            return 'No tienes permiso para realizar esta acción.';
        case 404:
            return 'Recurso no encontrado.';
        case 409:
            return 'El recurso ya existe.';
        case 429:
            return 'Demasiados intentos. Espera un momento.';
        case 500:
        default:
            return 'Error del servidor. Intenta más tarde.';
    }
}

export default api;
