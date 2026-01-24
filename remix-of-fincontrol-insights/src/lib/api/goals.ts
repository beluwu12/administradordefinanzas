/**
 * Goals API service
 */

import api from './client';
import type { ApiResponse, BackendGoal, BackendGoalContribution, Goal, GoalInput, ContributionInput, FundHistory } from './types';
import { transformGoal, transformContribution, getGoalColor } from './transformers';

export const goalsApi = {
    getAll: async (): Promise<Goal[]> => {
        const response = await api.get<ApiResponse<BackendGoal[]>>('/goals');
        return response.data.data.map((goal, index) => ({
            ...transformGoal(goal),
            color: getGoalColor(goal, index),
        }));
    },

    getById: async (id: string): Promise<Goal> => {
        const response = await api.get<ApiResponse<BackendGoal>>(`/goals/${id}`);
        return transformGoal(response.data.data);
    },

    create: async (input: GoalInput): Promise<Goal> => {
        const response = await api.post<ApiResponse<BackendGoal>>('/goals', input);
        return transformGoal(response.data.data);
    },

    update: async (id: string, input: Partial<GoalInput>): Promise<Goal> => {
        const response = await api.put<ApiResponse<BackendGoal>>(`/goals/${id}`, input);
        return transformGoal(response.data.data);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/goals/${id}`);
    },

    // Contributions
    getContributions: async (goalId: string): Promise<FundHistory[]> => {
        const response = await api.get<ApiResponse<BackendGoalContribution[]>>(`/goals/${goalId}/contributions`);
        return response.data.data.map(transformContribution);
    },

    addContribution: async (goalId: string, input: ContributionInput): Promise<FundHistory> => {
        const response = await api.post<ApiResponse<BackendGoalContribution>>(`/goals/${goalId}/contributions`, input);
        return transformContribution(response.data.data);
    },
};
