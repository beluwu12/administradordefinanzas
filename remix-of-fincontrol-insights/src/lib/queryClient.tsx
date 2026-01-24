/**
 * React Query Client configuration
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a client with default options
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};
