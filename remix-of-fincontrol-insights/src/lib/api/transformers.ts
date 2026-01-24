/**
 * Data transformers: Backend <-> UI type conversion
 */

import type {
    BackendTransaction,
    BackendTag,
    BackendGoal,
    BackendGoalContribution,
    BackendBudget,
    BackendFixedExpense,
    BackendUser,
    Transaction,
    Category,
    Goal,
    FundHistory,
    Budget,
    RecurringTransaction,
    NotificationSettings,
    TransactionInput,
} from './types';

// ═══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════

export const transformTransaction = (backend: BackendTransaction): Transaction => ({
    id: backend.id,
    date: backend.date.split('T')[0],
    description: backend.description,
    category: backend.tags[0]?.name || 'Sin categoría',
    categoryColor: backend.tags[0]?.color || 'hsl(240, 5%, 64%)',
    amount: backend.amount,
    type: backend.type.toLowerCase() as 'income' | 'expense',
    recurringId: backend.fixedExpenseId || undefined,
});

export const transformTransactionToBackend = (
    tx: TransactionInput
): {
    description: string;
    amount: number;
    type: string;
    date: string;
    tagIds: string[];
} => ({
    description: tx.description,
    amount: tx.amount,
    type: tx.type.toUpperCase(),
    date: new Date(tx.date).toISOString(),
    tagIds: [tx.categoryId],
});

// ═══════════════════════════════════════════════════════════════
// CATEGORIES (Tags)
// ═══════════════════════════════════════════════════════════════

export const transformCategory = (tag: BackendTag): Category => ({
    id: tag.id,
    name: tag.name,
    color: tag.color || 'hsl(240, 5%, 64%)',
});

// ═══════════════════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════════════════

export const transformContribution = (c: BackendGoalContribution): FundHistory => ({
    id: c.id,
    amount: c.amount,
    date: c.date.split('T')[0],
    note: c.note || undefined,
});

export const transformGoal = (backend: BackendGoal): Goal => ({
    id: backend.id,
    name: backend.title,
    targetAmount: backend.totalCost,
    currentAmount: backend.savedAmount,
    deadline: backend.deadline?.split('T')[0] || '',
    color: backend.color || 'hsl(142, 76%, 36%)',
    fundHistory: (backend.contributions || []).map(transformContribution),
    createdAt: backend.createdAt.split('T')[0],
});

// ═══════════════════════════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════════════════════════

export const transformBudget = (backend: BackendBudget): Budget => ({
    id: backend.id,
    category: backend.tag.name,
    categoryId: backend.tagId,
    limit: backend.limit,
    spent: backend.spent || 0,
    color: backend.tag.color || 'hsl(240, 5%, 64%)',
    rolloverEnabled: backend.rolloverEnabled,
    rolloverAmount: backend.rolloverAmount,
});

// ═══════════════════════════════════════════════════════════════
// FIXED EXPENSES -> RECURRING TRANSACTIONS
// ═══════════════════════════════════════════════════════════════

export const transformFixedExpense = (expense: BackendFixedExpense): RecurringTransaction => ({
    id: expense.id,
    description: expense.description,
    category: 'Utilities', // Default - backend doesn't store category
    amount: expense.amount,
    type: 'expense', // Backend only supports expense
    frequency: 'monthly', // Backend only supports monthly
    startDate: '', // Not stored in backend
    nextDate: expense.nextDate || '',
    isActive: expense.isActive,
});

// ═══════════════════════════════════════════════════════════════
// USER PREFERENCES
// ═══════════════════════════════════════════════════════════════

export const transformUserToSettings = (user: BackendUser): NotificationSettings => ({
    pushEnabled: user.notifyPush,
    emailEnabled: user.notifyEmail,
    soundEnabled: user.notifySound,
    soundVolume: user.soundVolume,
    budgetAlerts: user.budgetAlerts,
    budgetThreshold: user.budgetThreshold,
    billReminders: user.billReminders,
    billReminderDays: user.billReminderDays,
    goalUpdates: user.notifyGoals,
    weeklyReport: user.notifyWeekly,
});

export const transformSettingsToBackend = (settings: Partial<NotificationSettings>): Record<string, unknown> => {
    const mapping: Record<string, string> = {
        pushEnabled: 'notifyPush',
        emailEnabled: 'notifyEmail',
        soundEnabled: 'notifySound',
        soundVolume: 'soundVolume',
        budgetAlerts: 'budgetAlerts',
        budgetThreshold: 'budgetThreshold',
        billReminders: 'billReminders',
        billReminderDays: 'billReminderDays',
        goalUpdates: 'notifyGoals',
        weeklyReport: 'notifyWeekly',
    };

    const result: Record<string, unknown> = {};
    for (const [uiKey, backendKey] of Object.entries(mapping)) {
        if (settings[uiKey as keyof NotificationSettings] !== undefined) {
            result[backendKey] = settings[uiKey as keyof NotificationSettings];
        }
    }
    return result;
};

// ═══════════════════════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════════════════════

const defaultGoalColors = [
    'hsl(142, 76%, 36%)',
    'hsl(330, 90%, 46%)',
    'hsl(200, 70%, 50%)',
    'hsl(280, 65%, 60%)',
    'hsl(27, 87%, 55%)',
    'hsl(173, 58%, 39%)',
];

export const getGoalColor = (goal: BackendGoal, index: number): string => {
    return goal.color || defaultGoalColors[index % defaultGoalColors.length];
};
