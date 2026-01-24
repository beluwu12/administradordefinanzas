/**
 * React Query hooks for insights and analytics
 */

import { useQuery } from '@tanstack/react-query';
import { insightApi } from '../insight';

export const INSIGHT_KEY = ['insight'];

export const useSummary = () => {
    return useQuery({
        queryKey: [...INSIGHT_KEY, 'summary'],
        queryFn: insightApi.getSummary,
        staleTime: 2 * 60 * 1000,
    });
};

export const useMonthlyComparison = (months = 5) => {
    return useQuery({
        queryKey: [...INSIGHT_KEY, 'monthly-comparison', months],
        queryFn: () => insightApi.getMonthlyComparison(months),
        staleTime: 5 * 60 * 1000,
    });
};

export const useBalanceHistory = (days = 30) => {
    return useQuery({
        queryKey: [...INSIGHT_KEY, 'balance-history', days],
        queryFn: () => insightApi.getBalanceHistory(days),
        staleTime: 5 * 60 * 1000,
    });
};
