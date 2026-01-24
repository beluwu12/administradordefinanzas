/**
 * API module exports
 */

// Client
export { default as api, setAuth, clearAuth, getToken, isAuthenticated } from './client';

// Services
export { transactionsApi } from './transactions';
export { categoriesApi } from './categories';
export { goalsApi } from './goals';
export { budgetsApi } from './budgets';
export { insightApi } from './insight';
export { authApi, fixedExpensesApi } from './user';

// Types
export type {
    Transaction,
    Category,
    Goal,
    Budget,
    FundHistory,
    RecurringTransaction,
    BalanceHistory,
    MonthlyComparison,
    NotificationSettings,
    TransactionInput,
    GoalInput,
    ContributionInput,
    BudgetInput,
    CategoryInput,
    CategoryData,
} from './types';

// Transformers
export {
    transformTransaction,
    transformCategory,
    transformGoal,
    transformBudget,
    transformContribution,
} from './transformers';
