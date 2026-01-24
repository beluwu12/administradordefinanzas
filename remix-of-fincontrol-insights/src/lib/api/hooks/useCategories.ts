/**
 * React Query hooks for categories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../categories';
import type { CategoryInput } from '../types';

export const CATEGORIES_KEY = ['categories'];

export const useCategories = () => {
    return useQuery({
        queryKey: CATEGORIES_KEY,
        queryFn: categoriesApi.getAll,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CategoryInput) => categoriesApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryInput> }) =>
            categoriesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
        },
    });
};
