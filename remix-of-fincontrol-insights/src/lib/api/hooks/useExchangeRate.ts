/**
 * React Query hook for BCV exchange rate
 */

import { useQuery } from '@tanstack/react-query';
import api from '../client';
import type { ApiResponse } from '../types';

interface ExchangeRateData {
    rate: number | null;
    source: string;
    updatedAt: string | null;
    message?: string;
}

export const EXCHANGE_RATE_KEY = ['exchange-rate', 'usd-ves'];

export const useExchangeRate = () => {
    return useQuery({
        queryKey: EXCHANGE_RATE_KEY,
        queryFn: async (): Promise<ExchangeRateData> => {
            const response = await api.get<ApiResponse<ExchangeRateData>>('/exchange-rate/usd-ves');
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    });
};

// Helper function to convert VES to USD
export const convertVesToUsd = (vesAmount: number, rate: number | null): number | null => {
    if (!rate || rate <= 0) return null;
    return vesAmount / rate;
};

// Helper function to convert USD to VES
export const convertUsdToVes = (usdAmount: number, rate: number | null): number | null => {
    if (!rate || rate <= 0) return null;
    return usdAmount * rate;
};
