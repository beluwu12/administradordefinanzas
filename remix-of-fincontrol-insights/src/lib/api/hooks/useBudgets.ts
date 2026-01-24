/**
 * React Query hooks for budgets
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '../budgets';
import type { BudgetInput } from '../types';

export const BUDGETS_KEY = ['budgets'];

export const useBudgets = (params?: { month?: number; year?: number }) => {
    return useQuery({
        queryKey: [...BUDGETS_KEY, params],
        queryFn: () => budgetsApi.getAll(params),
        staleTime: 2 * 60 * 1000,
    });
};

export const useCreateBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: BudgetInput) => budgetsApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
        },
    });
};

export const useUpdateBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { limit?: number; rolloverEnabled?: boolean } }) =>
            budgetsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
        },
    });
};

export const useDeleteBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => budgetsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
        },
    });
};

export const useExecuteRollover = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => budgetsApi.executeRollover(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
        },
    });
};
