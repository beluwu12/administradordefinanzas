/**
 * React Query hooks for goals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '../goals';
import type { GoalInput, ContributionInput } from '../types';

export const GOALS_KEY = ['goals'];

export const useGoals = () => {
    return useQuery({
        queryKey: GOALS_KEY,
        queryFn: goalsApi.getAll,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGoal = (id: string) => {
    return useQuery({
        queryKey: [...GOALS_KEY, id],
        queryFn: () => goalsApi.getById(id),
        enabled: !!id,
    });
};

export const useGoalContributions = (goalId: string) => {
    return useQuery({
        queryKey: [...GOALS_KEY, goalId, 'contributions'],
        queryFn: () => goalsApi.getContributions(goalId),
        enabled: !!goalId,
    });
};

export const useCreateGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: GoalInput) => goalsApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GOALS_KEY });
        },
    });
};

export const useUpdateGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<GoalInput> }) =>
            goalsApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: GOALS_KEY });
            queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, id] });
        },
    });
};

export const useDeleteGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => goalsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GOALS_KEY });
        },
    });
};

export const useAddContribution = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ goalId, data }: { goalId: string; data: ContributionInput }) =>
            goalsApi.addContribution(goalId, data),
        onSuccess: (_, { goalId }) => {
            queryClient.invalidateQueries({ queryKey: GOALS_KEY });
            queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, goalId, 'contributions'] });
        },
    });
};
