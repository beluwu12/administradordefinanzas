/**
 * Transactions API service
 */

import api from './client';
import type { ApiResponse, BackendTransaction, TransactionInput, Transaction } from './types';
import { transformTransaction, transformTransactionToBackend } from './transformers';

export const transactionsApi = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        type?: 'INCOME' | 'EXPENSE';
        search?: string;
    }): Promise<Transaction[]> => {
        const response = await api.get<ApiResponse<BackendTransaction[]>>('/transactions', { params });
        return response.data.data.map(transformTransaction);
    },

    getById: async (id: string): Promise<Transaction> => {
        const response = await api.get<ApiResponse<BackendTransaction>>(`/transactions/${id}`);
        return transformTransaction(response.data.data);
    },

    create: async (input: TransactionInput): Promise<Transaction> => {
        const backendData = transformTransactionToBackend(input);
        const response = await api.post<ApiResponse<BackendTransaction>>('/transactions', backendData);
        return transformTransaction(response.data.data);
    },

    update: async (id: string, input: Partial<TransactionInput>): Promise<Transaction> => {
        const backendData: Record<string, unknown> = {};
        if (input.description) backendData.description = input.description;
        if (input.amount) backendData.amount = input.amount;
        if (input.type) backendData.type = input.type.toUpperCase();
        if (input.date) backendData.date = new Date(input.date).toISOString();
        if (input.categoryId) backendData.tagIds = [input.categoryId];

        const response = await api.put<ApiResponse<BackendTransaction>>(`/transactions/${id}`, backendData);
        return transformTransaction(response.data.data);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/transactions/${id}`);
    },

    getBalance: async (): Promise<{ balance: number; income: number; expense: number }> => {
        const response = await api.get<ApiResponse<{ balance: number; income: number; expense: number }>>('/transactions/balance');
        return response.data.data;
    },
};
