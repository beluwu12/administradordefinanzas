/**
 * React Query hooks for transactions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../transactions';
import type { TransactionInput } from '../types';

export const TRANSACTIONS_KEY = ['transactions'];

export const useTransactions = (params?: {
    page?: number;
    limit?: number;
    type?: 'INCOME' | 'EXPENSE';
}) => {
    return useQuery({
        queryKey: [...TRANSACTIONS_KEY, params],
        queryFn: () => transactionsApi.getAll(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: TransactionInput) => transactionsApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
            queryClient.invalidateQueries({ queryKey: ['insight'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TransactionInput> }) =>
            transactionsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
            queryClient.invalidateQueries({ queryKey: ['insight'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => transactionsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
            queryClient.invalidateQueries({ queryKey: ['insight'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
};
