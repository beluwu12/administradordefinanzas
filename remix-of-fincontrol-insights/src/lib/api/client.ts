/**
 * API Client — Axios instance with auth, refresh, and dev logging
 * 
 * Features:
 * - Auth token injection via request interceptor
 * - Token refresh on 401 with request queue
 * - Development logging via debugger.ts
 * - Correlation ID (x-request-id) for tracing
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { addLogEntry } from './debugger';

// API base URL — use environment variable or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Storage keys
const TOKEN_KEY = 'finance_token';
const REFRESH_KEY = 'finance_refresh';

// Development mode flag
const IS_DEV = import.meta.env.DEV;

// Generate a short unique ID for request correlation
const generateRequestId = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
};

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR — Auth token + Correlation ID + Timing
// ═══════════════════════════════════════════════════════════════

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add auth token
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add correlation ID for request tracing (frontend ↔ backend)
        const requestId = generateRequestId();
        if (config.headers) {
            config.headers['x-request-id'] = requestId;
        }

        // Attach timing metadata for the response interceptor
        if (IS_DEV) {
            (config as InternalAxiosRequestConfig & { _startTime?: number; _requestId?: string })._startTime = performance.now();
            (config as InternalAxiosRequestConfig & { _requestId?: string })._requestId = requestId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR — Logging + Token refresh
// ═══════════════════════════════════════════════════════════════

// Helper: Log request/response to debugger
const logApiCall = (
    config: InternalAxiosRequestConfig & { _startTime?: number; _requestId?: string },
    response?: AxiosResponse,
    error?: AxiosError
): void => {
    if (!IS_DEV) return;

    const duration = config._startTime
        ? Math.round(performance.now() - config._startTime)
        : 0;

    const url = config.url || '';
    const fullUrl = url.startsWith('http') ? url : `${config.baseURL || ''}${url}`;

    addLogEntry({
        timestamp: new Date().toISOString(),
        method: (config.method || 'GET').toUpperCase(),
        url: fullUrl,
        status: response?.status ?? error?.response?.status ?? null,
        duration,
        requestSize: config.data ? JSON.stringify(config.data).length : 0,
        responseSize: response?.data ? JSON.stringify(response.data).length : 0,
        error: error
            ? (error.response?.data as { error?: string })?.error
            || error.message
            || 'Unknown error'
            : null,
        requestHeaders: config.headers ? Object.fromEntries(
            Object.entries(config.headers).filter(([, v]) => typeof v === 'string')
        ) as Record<string, string> : {},
        responseHeaders: response?.headers
            ? Object.fromEntries(Object.entries(response.headers)) as Record<string, string>
            : {},
        requestBody: config.data || null,
        responseBody: response?.data ?? (error?.response?.data || null),
    });
};

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Success response interceptor — log only
api.interceptors.response.use(
    (response: AxiosResponse) => {
        const config = response.config as InternalAxiosRequestConfig & { _startTime?: number; _requestId?: string };
        logApiCall(config, response);
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
            _startTime?: number;
            _requestId?: string;
        };

        // Log the error
        if (originalRequest) {
            logApiCall(originalRequest, undefined, error);
        }

        // Handle 401 — attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Skip refresh for auth endpoints themselves
            const url = originalRequest.url || '';
            if (url.includes('/auth/login') || url.includes('/auth/register')) {
                return Promise.reject(formatError(error));
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Read CSRF token from cookie for the refresh request
                const csrfToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('csrf_token='))
                    ?.split('=')[1];

                const refreshHeaders: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (csrfToken) {
                    refreshHeaders['x-csrf-token'] = csrfToken;
                }

                const response = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    {
                        withCredentials: true,
                        headers: refreshHeaders,
                    }
                );

                const { token } = response.data.data;
                localStorage.setItem(TOKEN_KEY, token);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }

                processQueue(null, token);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);

                if (IS_DEV) {
                    console.warn(
                        '%c[AUTH] Token refresh failed — redirecting to login',
                        'color: #FF5722; font-weight: bold',
                        refreshError
                    );
                }

                clearAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(formatError(error));
    }
);

// ═══════════════════════════════════════════════════════════════
// ERROR FORMATTING
// ═══════════════════════════════════════════════════════════════

export interface ApiError extends Error {
    status: number;
    code?: string;
    originalError?: AxiosError;
}

const formatError = (error: AxiosError): ApiError => {
    let message: string;
    let status: number;
    let code: string | undefined;

    if (error.response) {
        const data = error.response.data as { error?: string; message?: string; code?: string };
        message = data.error || data.message || 'Error del servidor';
        status = error.response.status;
        code = data.code;
    } else if (error.request) {
        message = 'No se pudo conectar al servidor';
        status = 0;
        code = 'NETWORK_ERROR';
    } else {
        message = error.message || 'Error desconocido';
        status = 0;
    }

    // Create a proper Error instance so catch blocks can use err.message
    const apiError = new Error(message) as ApiError;
    apiError.status = status;
    apiError.code = code;
    apiError.originalError = error;
    return apiError;
};

// ═══════════════════════════════════════════════════════════════
// AUTH HELPERS
// ═══════════════════════════════════════════════════════════════

export const setAuth = (token: string, refreshToken?: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
        localStorage.setItem(REFRESH_KEY, refreshToken);
    }
};

export const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const isAuthenticated = () => !!getToken();

export default api;
