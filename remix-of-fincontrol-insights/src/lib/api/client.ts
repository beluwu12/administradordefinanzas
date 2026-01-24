/**
 * API Client for Lovable UI
 * Based on existing client/src/api.js with TypeScript adaptation
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL - use environment variable or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Storage keys
const TOKEN_KEY = 'finance_token';
const REFRESH_KEY = 'finance_refresh';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
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

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
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
                const response = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
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

// Error formatting
interface ApiError {
    message: string;
    status: number;
    code?: string;
}

const formatError = (error: AxiosError): ApiError => {
    if (error.response) {
        const data = error.response.data as { error?: string; message?: string; code?: string };
        return {
            message: data.error || data.message || 'Error del servidor',
            status: error.response.status,
            code: data.code,
        };
    }
    if (error.request) {
        return {
            message: 'No se pudo conectar al servidor',
            status: 0,
            code: 'NETWORK_ERROR',
        };
    }
    return {
        message: error.message || 'Error desconocido',
        status: 0,
    };
};

// Auth helpers
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
