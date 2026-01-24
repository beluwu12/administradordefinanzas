/**
 * Categories (Tags) API service
 */

import api from './client';
import type { ApiResponse, BackendTag, Category, CategoryInput } from './types';
import { transformCategory } from './transformers';

export const categoriesApi = {
    getAll: async (): Promise<Category[]> => {
        const response = await api.get<ApiResponse<BackendTag[]>>('/tags');
        return response.data.data.map(transformCategory);
    },

    create: async (input: CategoryInput): Promise<Category> => {
        const response = await api.post<ApiResponse<BackendTag>>('/tags', {
            name: input.name.trim(),
            color: input.color || 'hsl(240, 5%, 64%)',
        });
        return transformCategory(response.data.data);
    },

    update: async (id: string, input: Partial<CategoryInput>): Promise<Category> => {
        const response = await api.put<ApiResponse<BackendTag>>(`/tags/${id}`, input);
        return transformCategory(response.data.data);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/tags/${id}`);
    },

    getStats: async (id: string): Promise<{ count: number; total: number }> => {
        const response = await api.get<ApiResponse<{ count: number; total: number }>>(`/tags/${id}/transactions`);
        return response.data.data;
    },
};
