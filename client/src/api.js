/**
 * Centralized API Module
 * 
 * Features:
 * - Axios instance with base configuration
 * - Automatic JWT token attachment
 * - AUTOMATIC TOKEN REFRESH on 401 errors
 * - Standardized error handling
 * - Response unwrapping
 */

import axios from 'axios';
import API_URL from './config';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    withCredentials: true, // Enable cookies for refresh token
    headers: {
        'Content-Type': 'application/json'
    }
});

// ═══════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ═══════════════════════════════════════════════════════════════
// CSRF HELPERS - For cross-site cookie protection
// ═══════════════════════════════════════════════════════════════

/**
 * Get CSRF token from cookie (set by server on login)
 */
const getCsrfToken = () => {
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? match[1] : null;
};

/**
 * Get headers with CSRF token for cookie-dependent endpoints
 */
const getCsrfHeaders = () => {
    const token = getCsrfToken();
    return token ? { 'x-csrf-token': token } : {};
};

/**
 * Attempt to refresh the access token using httpOnly cookie
 * Returns new token or null if refresh fails
 */
const refreshAccessToken = async () => {
    try {
        // Cookie httpOnly se envía automáticamente con withCredentials
        // NO leemos de localStorage - el refresh token está solo en cookie
        // CSRF: header x-csrf-token must match csrf_token cookie
        const response = await axios.post(`${API_URL}/auth/refresh`, null, {
            withCredentials: true,
            headers: getCsrfHeaders()
        });

        if (response.data?.success && response.data?.data?.token) {
            const newToken = response.data.data.token;
            localStorage.setItem('finance_token', newToken);

            // Update user data if provided
            if (response.data.data.user) {
                localStorage.setItem('finance_user', JSON.stringify(response.data.data.user));
            }

            return newToken;
        }
    } catch (error) {
        console.warn('[API] Token refresh failed:', error.message);
    }

    return null;
};

/**
 * Clear all auth data and redirect to login
 * Calls logout endpoint to clear httpOnly cookie on server
 */
const clearAuthAndRedirect = async () => {
    localStorage.removeItem('finance_token');
    localStorage.removeItem('finance_user');

    // Call logout to clear httpOnly cookie on server
    // CSRF: header x-csrf-token must match csrf_token cookie
    try {
        await axios.post(`${API_URL}/auth/logout`, null, {
            withCredentials: true,
            headers: getCsrfHeaders()
        });
    } catch (e) {
        // Ignore logout errors - we're clearing local state regardless
    }

    window.location.href = '/login';
};

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR - Attach JWT token to all requests
// ═══════════════════════════════════════════════════════════════

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('finance_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR - Handle errors and auto-refresh tokens
// ═══════════════════════════════════════════════════════════════

api.interceptors.response.use(
    (response) => {
        // DO NOT unwrap response.data automatically
        // This preserves pagination metadata for list endpoints
        // Use unwrapData() or unwrapPaginated() helpers instead
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 with automatic token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh on login/register/refresh endpoints
            const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register') ||
                originalRequest.url?.includes('/auth/refresh');

            if (isAuthEndpoint) {
                return Promise.reject(formatError(error));
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshAccessToken();

                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    processQueue(null, newToken);
                    return api(originalRequest);
                } else {
                    // Refresh failed, clear auth and redirect
                    processQueue(new Error('Token refresh failed'), null);
                    clearAuthAndRedirect();
                    return Promise.reject(formatError(error));
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuthAndRedirect();
                return Promise.reject(formatError(error));
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(formatError(error));
    }
);

/**
 * Format error into standardized structure
 */
function formatError(error) {
    if (error.response) {
        const { status, data } = error.response;

        return {
            status,
            code: data?.code || 'ERROR',
            message: getErrorMessage(status, data),
            original: error
        };
    }

    if (error.code === 'ECONNABORTED') {
        return {
            status: 0,
            code: 'TIMEOUT',
            message: 'La solicitud tardó demasiado. Verifica tu conexión.',
            original: error
        };
    }

    return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Error de conexión. Verifica tu internet.',
        original: error
    };
}

/**
 * Get user-friendly error message based on status and response
 */
function getErrorMessage(status, data) {
    if (data?.message) {
        return data.message;
    }

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

// ═══════════════════════════════════════════════════════════════
// RESPONSE HELPERS - Use these instead of automatic unwrap
// ═══════════════════════════════════════════════════════════════

/**
 * Unwrap standard API response to get just the data
 * Use for endpoints that return { success, data }
 */
export const unwrapData = (response) => {
    if (response.data?.success && response.data?.data !== undefined) {
        return response.data.data;
    }
    return response.data;
};

/**
 * Unwrap paginated API response preserving pagination metadata
 * Use for list endpoints that return { success, data, pagination }
 */
export const unwrapPaginated = (response) => {
    if (response.data?.success) {
        return {
            data: response.data.data,
            pagination: response.data.pagination || null
        };
    }
    return { data: response.data, pagination: null };
};

/**
 * Check if response was successful
 */
export const isSuccess = (response) => {
    return response.data?.success === true;
};

export default api;

