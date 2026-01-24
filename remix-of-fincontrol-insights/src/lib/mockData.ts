/**
 * Mock Data Types and Constants
 * 
 * NOTE: This file contains mock data for UI development.
 * Components should migrate to API hooks for production:
 * import { useTransactions, useCategories, useBudgets, useGoals } from '@/lib/api/hooks';
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: RecurrenceFrequency;
  startDate: string;
  nextDate: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  categoryColor?: string;
  amount: number;
  type: 'income' | 'expense';
  recurringId?: string;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
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

export interface Budget {
  id: string;
  category: string;
  categoryId?: string;
  limit: number;
  spent: number;
  color: string;
  rolloverEnabled?: boolean;
  rolloverAmount?: number;
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

export interface Category {
  id: string;
  name: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════
// CURRENCIES CONSTANT
// ═══════════════════════════════════════════════════════════════

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CLP: { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  ARS: { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  COP: { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  VES: { code: 'VES', symbol: 'Bs.', name: 'Venezuelan Bolívar' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// ═══════════════════════════════════════════════════════════════
// CHART COLORS & CATEGORY COLORS
// ═══════════════════════════════════════════════════════════════

export const defaultColors = {
  income: 'hsl(142, 76%, 36%)',
  expense: 'hsl(330, 90%, 46%)',
  neutral: 'hsl(240, 5%, 64%)',
} as const;

export const categoryColors: Record<string, string> = {
  Food: 'hsl(330, 90%, 46%)',
  Utilities: 'hsl(173, 58%, 39%)',
  Entertainment: 'hsl(197, 37%, 24%)',
  Transportation: 'hsl(43, 74%, 66%)',
  Shopping: 'hsl(27, 87%, 67%)',
  Health: 'hsl(280, 65%, 60%)',
  Salary: 'hsl(142, 76%, 36%)',
  Freelance: 'hsl(160, 60%, 45%)',
  Investments: 'hsl(200, 70%, 50%)',
};

export const categoryIcons: Record<string, string> = {
  Food: '🍔',
  Utilities: '💡',
  Entertainment: '🎬',
  Transportation: '🚗',
  Shopping: '🛍️',
  Health: '💪',
  Salary: '💰',
  Freelance: '💼',
  Investments: '📈',
};

// ═══════════════════════════════════════════════════════════════
// MOCK DATA (for UI development - replace with API hooks)
// ═══════════════════════════════════════════════════════════════

export const transactions: Transaction[] = [
  { id: '1', date: '2026-01-12', description: 'Salary Deposit', category: 'Salary', amount: 5200, type: 'income' },
  { id: '2', date: '2026-01-11', description: 'Grocery Store', category: 'Food', amount: 156.42, type: 'expense' },
  { id: '3', date: '2026-01-10', description: 'Electric Bill', category: 'Utilities', amount: 89.50, type: 'expense' },
  { id: '4', date: '2026-01-09', description: 'Netflix Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
  { id: '5', date: '2026-01-08', description: 'Gas Station', category: 'Transportation', amount: 45.00, type: 'expense' },
];

export const budgets: Budget[] = [
  { id: '1', category: 'Food', limit: 500, spent: 236.72, color: categoryColors.Food },
  { id: '2', category: 'Utilities', limit: 200, spent: 164.50, color: categoryColors.Utilities },
  { id: '3', category: 'Entertainment', limit: 100, spent: 15.99, color: categoryColors.Entertainment },
  { id: '4', category: 'Transportation', limit: 150, spent: 45.00, color: categoryColors.Transportation },
];

export const recurringTransactions: RecurringTransaction[] = [
  { id: 'r1', description: 'Netflix', category: 'Entertainment', amount: 15.99, type: 'expense', frequency: 'monthly', startDate: '2025-01-09', nextDate: '2026-02-09', isActive: true },
  { id: 'r2', description: 'Salary', category: 'Salary', amount: 5200, type: 'income', frequency: 'monthly', startDate: '2025-01-12', nextDate: '2026-02-12', isActive: true },
];

export const goals: Goal[] = [
  { id: '1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 7500, deadline: '2026-06-01', color: 'hsl(142, 76%, 36%)', createdAt: '2025-06-15', fundHistory: [] },
  { id: '2', name: 'Vacation', targetAmount: 5000, currentAmount: 2800, deadline: '2026-08-15', color: 'hsl(330, 90%, 46%)', createdAt: '2025-09-01', fundHistory: [] },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export const getCategoryData = (): CategoryData[] => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || 'hsl(240, 5%, 64%)',
  }));
};

export const getCategoryStats = () => {
  const stats: Record<string, { count: number; total: number }> = {};
  transactions.forEach(t => {
    if (!stats[t.category]) stats[t.category] = { count: 0, total: 0 };
    stats[t.category].count++;
    if (t.type === 'expense') stats[t.category].total += t.amount;
  });
  return stats;
};

export const getTransactionsByCategory = (category: string): Transaction[] => {
  return transactions.filter(t => t.category === category);
};

export const getMonthlyComparison = (): MonthlyComparison[] => [
  { month: 'Sep', income: 5800, expenses: 4200 },
  { month: 'Oct', income: 6100, expenses: 4500 },
  { month: 'Nov', income: 5500, expenses: 4800 },
  { month: 'Dec', income: 7200, expenses: 5100 },
  { month: 'Jan', income: 6175, expenses: 641.19 },
];

export const getBalanceHistory = (): BalanceHistory[] => {
  const data: BalanceHistory[] = [];
  let balance = 12500;
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    balance += (Math.random() - 0.4) * 500;
    data.push({
      date: date.toISOString().split('T')[0],
      balance: Math.max(balance, 8000),
    });
  }

  return data;
};

export const getTotals = () => {
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return { income, expenses, balance, savingsRate };
};

export const getBudgetTotals = () => {
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = totalBudget - totalSpent;
  const percentage = (totalSpent / totalBudget) * 100;

  return { totalBudget, totalSpent, remaining, percentage };
};

export const getGoalTotals = () => {
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  return { totalTarget, totalSaved, completedGoals, totalGoals: goals.length };
};
