/**
 * Budgets API service
 */

import api from './client';
import type { ApiResponse, BackendBudget, Budget, BudgetInput } from './types';
import { transformBudget } from './transformers';

export const budgetsApi = {
    getAll: async (params?: { month?: number; year?: number }): Promise<Budget[]> => {
        const response = await api.get<ApiResponse<BackendBudget[]>>('/budgets', { params });
        return response.data.data.map(transformBudget);
    },

    create: async (input: BudgetInput): Promise<Budget> => {
        const response = await api.post<ApiResponse<BackendBudget>>('/budgets', input);
        return transformBudget(response.data.data);
    },

    update: async (id: string, input: { limit?: number; rolloverEnabled?: boolean }): Promise<Budget> => {
        const response = await api.put<ApiResponse<BackendBudget>>(`/budgets/${id}`, input);
        return transformBudget(response.data.data);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/budgets/${id}`);
    },

    executeRollover: async (): Promise<{ count: number }> => {
        const response = await api.post<ApiResponse<Array<{ tagId: string }>>>('/budgets/rollover');
        return { count: response.data.data.length };
    },
};
