/**
 * React Query hooks for fixed expenses (upcoming bills)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fixedExpensesApi } from '../user';

export const FIXED_EXPENSES_KEY = ['fixed-expenses'];

export const useFixedExpenses = () => {
    return useQuery({
        queryKey: FIXED_EXPENSES_KEY,
        queryFn: fixedExpensesApi.getAll,
        staleTime: 5 * 60 * 1000,
    });
};

export const useUpcomingBills = (days = 30) => {
    return useQuery({
        queryKey: [...FIXED_EXPENSES_KEY, 'upcoming', days],
        queryFn: () => fixedExpensesApi.getUpcoming(days),
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateFixedExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { description: string; amount: number; dueDay: number; currency?: string }) =>
            fixedExpensesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FIXED_EXPENSES_KEY });
        },
    });
};

export const useUpdateFixedExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { description?: string; amount?: number; dueDay?: number; isActive?: boolean };
        }) => fixedExpensesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FIXED_EXPENSES_KEY });
        },
    });
};

export const useDeleteFixedExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => fixedExpensesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FIXED_EXPENSES_KEY });
        },
    });
};
