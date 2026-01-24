/**
 * Insight & Analytics API service
 */

import api from './client';
import type { ApiResponse, BalanceHistory, MonthlyComparison } from './types';

interface Summary {
    totalIncome: Record<string, number>;
    totalExpense: Record<string, number>;
    netSavings: Record<string, number>;
    topExpenseTags: Array<{ name: string; total: number; count: number }>;
    changePercent: number;
    userCurrency: string;
    isDual: boolean;
}

export const insightApi = {
    getSummary: async (): Promise<Summary> => {
        const response = await api.get<ApiResponse<Summary>>('/insight/summary');
        return response.data.data;
    },

    getMonthlyComparison: async (months = 5): Promise<MonthlyComparison[]> => {
        const response = await api.get<ApiResponse<MonthlyComparison[]>>('/insight/monthly-comparison', {
            params: { months },
        });
        return response.data.data;
    },

    getBalanceHistory: async (days = 30): Promise<BalanceHistory[]> => {
        const response = await api.get<ApiResponse<BalanceHistory[]>>('/insight/balance-history', {
            params: { days },
        });
        return response.data.data;
    },
};
