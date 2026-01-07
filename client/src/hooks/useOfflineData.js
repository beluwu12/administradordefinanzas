/**
 * useOfflineData - React hook for seamless offline/online data access
 * 
 * Automatically uses local SQLite when offline, syncs when online.
 * Provides unified interface for data operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import databaseService from '../services/DatabaseService';
import syncService from '../services/SyncService';

/**
 * Hook for offline-capable data operations
 * @param {string} entity - Entity type: 'transactions', 'tags', 'goals', 'fixedExpenses'
 */
export function useOfflineData(entity) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncStatus, setSyncStatus] = useState({ isOnline: true, isSyncing: false });
    const [pendingCount, setPendingCount] = useState(0);

    const isNative = Capacitor.isNativePlatform();

    // Get current user ID
    const getUserId = useCallback(() => {
        try {
            const userStr = localStorage.getItem('finance_user');
            if (userStr) {
                return JSON.parse(userStr).id;
            }
        } catch (e) {
            console.error('Failed to get user ID:', e);
        }
        return null;
    }, []);

    // Load data from local database
    const loadLocalData = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return [];

        switch (entity) {
            case 'transactions':
                return databaseService.getTransactions(userId);
            case 'tags':
                return databaseService.getTags(userId);
            case 'goals':
                return databaseService.getGoals(userId);
            case 'fixedExpenses':
                return databaseService.getFixedExpenses(userId);
            default:
                return [];
        }
    }, [entity, getUserId]);

    // Refresh data
    const refresh = useCallback(async () => {
        if (!isNative) return; // Only for native platforms

        setLoading(true);
        setError(null);

        try {
            const localData = await loadLocalData();
            setData(localData);

            const count = await syncService.getPendingCount();
            setPendingCount(count);
        } catch (err) {
            setError(err.message);
            console.error(`[useOfflineData] Error loading ${entity}:`, err);
        } finally {
            setLoading(false);
        }
    }, [isNative, loadLocalData, entity]);

    // Initialize
    useEffect(() => {
        if (!isNative) {
            setLoading(false);
            return;
        }

        // Initialize database and sync services
        const init = async () => {
            try {
                await databaseService.initialize();
                await syncService.initialize();
                await refresh();
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        init();

        // Subscribe to sync status changes
        const unsubscribe = syncService.addListener((status) => {
            setSyncStatus(status);
            // Refresh data after sync completes
            if (!status.isSyncing) {
                refresh();
            }
        });

        return () => {
            unsubscribe();
        };
    }, [isNative, refresh]);

    // Save operation
    const save = useCallback(async (item, isNew = true) => {
        if (!isNative) {
            throw new Error('Offline save only available on native platforms');
        }

        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');

        const itemWithUser = { ...item, userId };

        try {
            switch (entity) {
                case 'transactions':
                    await databaseService.saveTransaction(itemWithUser, isNew);
                    break;
                case 'tags':
                    await databaseService.saveTag(itemWithUser, isNew);
                    break;
                case 'goals':
                    await databaseService.saveGoal(itemWithUser, isNew);
                    break;
                case 'fixedExpenses':
                    await databaseService.saveFixedExpense(itemWithUser, isNew);
                    break;
            }

            // Refresh data after save
            await refresh();

            // Try to sync if online
            if (syncService.isOnline) {
                syncService.sync();
            }

            return itemWithUser;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [isNative, entity, getUserId, refresh]);

    // Delete operation
    const remove = useCallback(async (id) => {
        if (!isNative) {
            throw new Error('Offline delete only available on native platforms');
        }

        try {
            switch (entity) {
                case 'transactions':
                    await databaseService.deleteTransaction(id);
                    break;
                case 'tags':
                    await databaseService.deleteTag(id);
                    break;
                case 'goals':
                    await databaseService.deleteGoal(id);
                    break;
                case 'fixedExpenses':
                    await databaseService.deleteFixedExpense(id);
                    break;
            }

            await refresh();

            // Try to sync if online
            if (syncService.isOnline) {
                syncService.sync();
            }
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [isNative, entity, refresh]);

    // Manual sync trigger
    const manualSync = useCallback(async () => {
        if (!isNative) return { success: false, reason: 'not native' };
        return syncService.sync();
    }, [isNative]);

    return {
        // Data
        data,
        loading,
        error,

        // Operations
        save,
        remove,
        refresh,

        // Sync status
        isOnline: syncStatus.isOnline,
        isSyncing: syncStatus.isSyncing,
        pendingCount,
        manualSync,

        // Platform info
        isNative
    };
}

/**
 * Hook specifically for sync status (lighter weight)
 */
export function useSyncStatus() {
    const [status, setStatus] = useState({ isOnline: true, isSyncing: false });
    const [pendingCount, setPendingCount] = useState(0);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        if (!isNative) return;

        const updatePending = async () => {
            const count = await syncService.getPendingCount();
            setPendingCount(count);
        };

        const unsubscribe = syncService.addListener((newStatus) => {
            setStatus(newStatus);
            updatePending();
        });

        // Initial status
        setStatus(syncService.getStatus());
        updatePending();

        return unsubscribe;
    }, [isNative]);

    return {
        isOnline: status.isOnline,
        isSyncing: status.isSyncing,
        pendingCount,
        sync: () => syncService.sync(),
        isNative
    };
}

export default useOfflineData;
