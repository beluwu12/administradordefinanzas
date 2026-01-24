/**
 * TypeScript types for API responses and data models
 * Maps between Backend and Lovable UI interfaces
 */

// ═══════════════════════════════════════════════════════════════
// API RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════
// BACKEND TYPES (as returned from API)
// ═══════════════════════════════════════════════════════════════

export interface BackendUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    country: string;
    defaultCurrency: string;
    timezone: string;
    language: string;
    theme: string;
    dualCurrencyEnabled: boolean;
    notifyPush: boolean;
    notifyEmail: boolean;
    notifySound: boolean;
    soundVolume: number;
    budgetAlerts: boolean;
    budgetThreshold: number;
    billReminders: boolean;
    billReminderDays: number;
    notifyGoals: boolean;
    notifyWeekly: boolean;
}

export interface BackendTag {
    id: string;
    name: string;
    color: string | null;
    userId: string;
    createdAt: string;
}

export interface BackendTransaction {
    id: string;
    amount: number;
    currency: string;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    date: string;
    fixedExpenseId: string | null;
    tags: BackendTag[];
    userId: string;
    createdAt: string;
}

export interface BackendGoalContribution {
    id: string;
    amount: number;
    note: string | null;
    date: string;
    goalId: string;
}

export interface BackendGoal {
    id: string;
    title: string;
    description: string | null;
    totalCost: number;
    currency: string;
    color: string | null;
    durationMonths: number;
    monthlyAmount: number;
    deadline: string | null;
    startDate: string;
    savedAmount: number;
    tag: string | null;
    contributions?: BackendGoalContribution[];
    createdAt: string;
}

export interface BackendBudget {
    id: string;
    limit: number;
    rolloverEnabled: boolean;
    rolloverAmount: number;
    month: number;
    year: number;
    tagId: string;
    tag: BackendTag;
    spent?: number;
    remaining?: number;
    percentage?: number;
}

export interface BackendFixedExpense {
    id: string;
    amount: number;
    currency: string;
    description: string;
    dueDay: number;
    isActive: boolean;
    nextDate?: string;
    daysUntilDue?: number;
}

// ═══════════════════════════════════════════════════════════════
// UI TYPES (as used in Lovable components)
// ═══════════════════════════════════════════════════════════════

export interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    categoryColor?: string;
    amount: number;
    currency?: string;
    type: 'income' | 'expense';
    recurringId?: string;
}

export interface RecurringTransaction {
    id: string;
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    frequency: 'monthly';
    startDate: string;
    nextDate: string;
    isActive: boolean;
}

export interface Category {
    id: string;
    name: string;
    color: string;
}

export interface CategoryData {
    name: string;
    value: number;
    color: string;
}

export interface FundHistory {
    id: string;
    amount: number;
    date: string;
    note?: string;
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    color: string;
    fundHistory: FundHistory[];
    createdAt: string;
}

export interface Budget {
    id: string;
    category: string;
    categoryId: string;
    limit: number;
    spent: number;
    color: string;
    rolloverEnabled?: boolean;
    rolloverAmount?: number;
}

export interface BalanceHistory {
    date: string;
    balance: number;
}

export interface MonthlyComparison {
    month: string;
    income: number;
    expenses: number;
}

export interface NotificationSettings {
    pushEnabled: boolean;
    emailEnabled: boolean;
    soundEnabled: boolean;
    soundVolume: number;
    budgetAlerts: boolean;
    budgetThreshold: number;
    billReminders: boolean;
    billReminderDays: number;
    goalUpdates: boolean;
    weeklyReport: boolean;
}

// ═══════════════════════════════════════════════════════════════
// INPUT TYPES (for creating/updating)
// ═══════════════════════════════════════════════════════════════

export interface TransactionInput {
    description: string;
    amount: number;
    currency?: string;
    type: 'income' | 'expense';
    date: string;
    categoryId: string;
}

export interface GoalInput {
    title: string;
    totalCost: number;
    monthlyAmount: number;
    currency?: string;
    startDate?: string;
    description?: string;
    color?: string;
}

export interface ContributionInput {
    amount: number;
    note?: string;
    date?: string;
}

export interface BudgetInput {
    tagId: string;
    limit: number;
    month?: number;
    year?: number;
}

export interface CategoryInput {
    name: string;
    color?: string;
}
