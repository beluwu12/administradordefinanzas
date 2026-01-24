/**
 * Hooks index - re-export all hooks
 */

// Categories
export { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './useCategories';

// Transactions
export { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from './useTransactions';

// Goals
export { useGoals, useGoal, useGoalContributions, useCreateGoal, useUpdateGoal, useDeleteGoal, useAddContribution } from './useGoals';

// Budgets
export { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useExecuteRollover } from './useBudgets';

// Insight
export { useSummary, useMonthlyComparison, useBalanceHistory } from './useInsight';

// Fixed Expenses
export { useFixedExpenses, useUpcomingBills, useCreateFixedExpense, useUpdateFixedExpense, useDeleteFixedExpense } from './useFixedExpenses';

// Exchange Rate
export { useExchangeRate, convertVesToUsd, convertUsdToVes } from './useExchangeRate';
