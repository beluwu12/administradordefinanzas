/**
 * Centralized Application Configuration
 * 
 * This module exports the app configuration loaded once at startup.
 * All modules should import config values from here instead of hardcoding.
 * 
 * Usage:
 *   import config from '@/config';
 *   const timeout = config.api.timeout;
 * 
 * Or destructure:
 *   import { api, budget, goals } from '@/config';
 */

import appConfig from './app.config.json';

// Type definitions for configuration
export interface AppConfig {
    app: {
        name: string;
        version: string;
        description: string;
    };
    api: {
        baseUrl: string;
        timeout: number;
        retryAttempts: number;
    };
    bcv: {
        maxRetries: number;
        retryDelayMs: number;
        cacheTtlSeconds: number;
    };
    cache: {
        defaultTtlSeconds: number;
        exchangeRateTtl: number;
        transactionsTtl: number;
    };
    pagination: {
        defaultPageSize: number;
        maxPageSize: number;
    };
    budget: {
        thresholdWarning: number;
        thresholdCritical: number;
        defaultAlertThreshold: number;
    };
    goals: {
        colors: string[];
    };
    notifications: {
        defaultVolume: number;
        maxVolume: number;
        defaultBillReminderDays: number;
        maxBillReminderDays: number;
    };
    transactions: {
        recentLimit: number;
        defaultSortOrder: string;
    };
    charts: {
        monthlyComparisonMonths: number;
        balanceHistoryDays: number;
    };
    countries: {
        default: string;
        supported: string[];
    };
    currencies: {
        default: string;
        supported: string[];
    };
    ui: {
        animationDuration: number;
        toastDuration: number;
        skeletonShimmer: boolean;
    };
}

// Export typed config
const config: AppConfig = appConfig as AppConfig;

// Named exports for convenient destructuring
export const { app, api, bcv, cache, pagination, budget, goals, notifications, transactions, charts, countries, currencies, ui } = config;

// Default export for full config access
export default config;
