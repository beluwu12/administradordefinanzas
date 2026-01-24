/**
 * User preferences & Auth API service
 */

import api, { setAuth, clearAuth } from './client';
import type { ApiResponse, BackendUser, BackendFixedExpense, NotificationSettings, RecurringTransaction } from './types';
import { transformUserToSettings, transformSettingsToBackend, transformFixedExpense } from './transformers';

// Backend returns a flat response with user data + token at same level
interface LoginResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    country: string;
    defaultCurrency: string;
    timezone: string;
    token: string;
    expiresIn?: number;
}

export const authApi = {
    login: async (credentials: { email: string; password: string }): Promise<{ user: BackendUser; token: string }> => {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
        const data = response.data.data;
        setAuth(data.token);
        // Transform flat response to expected format
        return {
            token: data.token,
            user: {
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                country: data.country,
                defaultCurrency: data.defaultCurrency,
                timezone: data.timezone,
                language: 'es',
                theme: 'system',
                notifyPush: true,
                notifyEmail: true,
                notifySound: true,
                soundVolume: 50,
                budgetAlerts: true,
                budgetThreshold: 80,
                billReminders: true,
                billReminderDays: 3,
                notifyGoals: true,
                notifyWeekly: true,
            }
        };
    },

    register: async (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<{ user: BackendUser }> => {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
        const responseData = response.data.data;
        setAuth(responseData.token);
        // Transform flat response to expected format
        return {
            user: {
                id: responseData.id,
                email: responseData.email,
                firstName: responseData.firstName,
                lastName: responseData.lastName,
                country: responseData.country,
                defaultCurrency: responseData.defaultCurrency,
                timezone: responseData.timezone,
                language: 'es',
                theme: 'system',
                notifyPush: true,
                notifyEmail: true,
                notifySound: true,
                soundVolume: 50,
                budgetAlerts: true,
                budgetThreshold: 80,
                billReminders: true,
                billReminderDays: 3,
                notifyGoals: true,
                notifyWeekly: true,
            }
        };
    },

    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } finally {
            clearAuth();
        }
    },

    getMe: async (): Promise<BackendUser> => {
        const response = await api.get<ApiResponse<BackendUser>>('/auth/me');
        return response.data.data;
    },

    getProfile: async (): Promise<BackendUser> => {
        const response = await api.get<ApiResponse<BackendUser>>('/auth/me');
        return response.data.data;
    },

    getUsers: async (): Promise<{ id: string; name: string }[]> => {
        const response = await api.get<ApiResponse<{ id: string; name: string }[]>>('/users');
        return response.data.data || [];
    },

    verifyPin: async (userId: string, pin: string): Promise<{ token: string; refreshToken?: string; user: BackendUser }> => {
        const response = await api.post<ApiResponse<{ token: string; refreshToken?: string; user: BackendUser }>>('/users/verify-pin', { userId, pin });
        const data = response.data.data;
        setAuth(data.token, data.refreshToken);
        return data;
    },

    getPreferences: async (): Promise<NotificationSettings> => {
        const user = await authApi.getMe();
        return transformUserToSettings(user);
    },

    updatePreferences: async (settings: Partial<NotificationSettings>): Promise<BackendUser> => {
        const backendData = transformSettingsToBackend(settings);
        const response = await api.patch<ApiResponse<BackendUser>>('/auth/preferences', backendData);
        return response.data.data;
    },

    updateProfile: async (data: { firstName?: string; lastName?: string }): Promise<BackendUser> => {
        const response = await api.put<ApiResponse<BackendUser>>('/auth/profile', data);
        return response.data.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.put('/auth/password', { currentPassword, newPassword });
    },

    deleteAccount: async (password: string): Promise<void> => {
        await api.delete('/auth/account', { data: { password } });
        clearAuth();
    },
};

// Fixed expenses (recurring transactions)
export const fixedExpensesApi = {
    getAll: async (): Promise<RecurringTransaction[]> => {
        const response = await api.get<ApiResponse<BackendFixedExpense[]>>('/fixed-expenses');
        return response.data.data.map(transformFixedExpense);
    },

    getUpcoming: async (days = 30): Promise<RecurringTransaction[]> => {
        const response = await api.get<ApiResponse<BackendFixedExpense[]>>('/fixed-expenses/upcoming', {
            params: { days },
        });
        return response.data.data.map(transformFixedExpense);
    },

    create: async (data: {
        description: string;
        amount: number;
        dueDay: number;
        currency?: string;
    }): Promise<RecurringTransaction> => {
        const response = await api.post<ApiResponse<BackendFixedExpense>>('/fixed-expenses', data);
        return transformFixedExpense(response.data.data);
    },

    update: async (id: string, data: {
        description?: string;
        amount?: number;
        dueDay?: number;
        isActive?: boolean;
    }): Promise<RecurringTransaction> => {
        const response = await api.put<ApiResponse<BackendFixedExpense>>(`/fixed-expenses/${id}`, data);
        return transformFixedExpense(response.data.data);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/fixed-expenses/${id}`);
    },
};
