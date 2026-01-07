/**
 * SyncService - Automatic synchronization between SQLite and server
 * 
 * Handles:
 * - Detecting network connectivity changes
 * - Syncing pending local changes to server
 * - Downloading server changes to local DB
 * - Conflict resolution (last-write-wins)
 */

import { Network } from '@capacitor/network';
import databaseService from './DatabaseService';
import api from '../api';

class SyncService {
    isOnline = true;
    isSyncing = false;
    syncInterval = null;
    listeners = new Set();

    /**
     * Initialize the sync service
     */
    async initialize() {
        // Check initial network status
        const status = await Network.getStatus();
        this.isOnline = status.connected;

        // Listen for network changes
        Network.addListener('networkStatusChange', async (status) => {
            const wasOffline = !this.isOnline;
            this.isOnline = status.connected;

            console.log(`[SyncService] Network status: ${this.isOnline ? 'online' : 'offline'}`);

            // If we just came online, trigger sync
            if (wasOffline && this.isOnline) {
                console.log('[SyncService] Connection restored, syncing...');
                await this.sync();
            }

            this.notifyListeners();
        });

        // Periodic sync when online (every 5 minutes)
        this.syncInterval = setInterval(() => {
            if (this.isOnline && !this.isSyncing) {
                this.sync();
            }
        }, 5 * 60 * 1000);

        console.log('[SyncService] Initialized');
    }

    /**
     * Main sync function - syncs both directions
     */
    async sync() {
        if (this.isSyncing || !this.isOnline) {
            return { success: false, reason: this.isSyncing ? 'already syncing' : 'offline' };
        }

        this.isSyncing = true;
        this.notifyListeners();

        try {
            // 1. Upload pending local changes
            await this.uploadPendingChanges();

            // 2. Download server changes
            await this.downloadServerChanges();

            // Update last sync time
            await databaseService.setLastSyncTime(new Date().toISOString());

            console.log('[SyncService] Sync completed successfully');
            return { success: true };
        } catch (error) {
            console.error('[SyncService] Sync error:', error);
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
            this.notifyListeners();
        }
    }

    /**
     * Upload all pending local changes to server
     */
    async uploadPendingChanges() {
        const pendingItems = await databaseService.getPendingSync();
        console.log(`[SyncService] Uploading ${pendingItems.length} pending changes`);

        for (const item of pendingItems) {
            try {
                await this.processQueueItem(item);
                await databaseService.removeSyncItem(item.id);
                await databaseService.markAsSynced(item.entity, item.entityId);
            } catch (error) {
                console.error(`[SyncService] Failed to sync item ${item.id}:`, error);
                await databaseService.incrementSyncAttempt(item.id);

                // Don't fail entire sync for one item
                if (item.attempts >= 3) {
                    console.warn(`[SyncService] Removing item ${item.id} after 3 failed attempts`);
                    await databaseService.removeSyncItem(item.id);
                }
            }
        }
    }

    /**
     * Process a single sync queue item
     */
    async processQueueItem(item) {
        const payload = JSON.parse(item.payload);

        switch (item.entity) {
            case 'transaction':
                await this.syncTransaction(item.operation, payload);
                break;
            case 'tag':
                await this.syncTag(item.operation, payload);
                break;
            case 'goal':
                await this.syncGoal(item.operation, payload);
                break;
            case 'fixed_expense':
                await this.syncFixedExpense(item.operation, payload);
                break;
            default:
                console.warn(`[SyncService] Unknown entity type: ${item.entity}`);
        }
    }

    async syncTransaction(operation, data) {
        switch (operation) {
            case 'CREATE':
                await api.post('/transactions', data);
                break;
            case 'UPDATE':
                await api.put(`/transactions/${data.id}`, data);
                break;
            case 'DELETE':
                await api.delete(`/transactions/${data.id}`);
                break;
        }
    }

    async syncTag(operation, data) {
        switch (operation) {
            case 'CREATE':
                await api.post('/tags', data);
                break;
            case 'UPDATE':
                await api.put(`/tags/${data.id}`, data);
                break;
            case 'DELETE':
                await api.delete(`/tags/${data.id}`);
                break;
        }
    }

    async syncGoal(operation, data) {
        switch (operation) {
            case 'CREATE':
                await api.post('/goals', data);
                break;
            case 'UPDATE':
                await api.put(`/goals/${data.id}`, data);
                break;
            case 'DELETE':
                await api.delete(`/goals/${data.id}`);
                break;
        }
    }

    async syncFixedExpense(operation, data) {
        switch (operation) {
            case 'CREATE':
                await api.post('/fixed-expenses', data);
                break;
            case 'UPDATE':
                await api.put(`/fixed-expenses/${data.id}`, data);
                break;
            case 'DELETE':
                await api.delete(`/fixed-expenses/${data.id}`);
                break;
        }
    }

    /**
     * Download changes from server since last sync
     */
    async downloadServerChanges() {
        const lastSync = await databaseService.getLastSyncTime();
        console.log(`[SyncService] Downloading changes since: ${lastSync || 'beginning'}`);

        try {
            // Fetch all data from server
            // Note: Ideally the API would support delta sync with ?since=timestamp
            const [transRes, tagsRes, goalsRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/tags'),
                api.get('/goals')
            ]);

            const userId = this.getCurrentUserId();

            // Bulk insert/update to local DB
            if (transRes.data?.data) {
                await databaseService.bulkInsertTransactions(transRes.data.data, userId);
            }

            if (tagsRes.data?.data) {
                await databaseService.bulkInsertTags(tagsRes.data.data, userId);
            }

            if (goalsRes.data?.data) {
                await databaseService.bulkInsertGoals(goalsRes.data.data, userId);
            }

            console.log('[SyncService] Server changes downloaded');
        } catch (error) {
            console.error('[SyncService] Failed to download server changes:', error);
            throw error;
        }
    }

    /**
     * Get current user ID from localStorage
     */
    getCurrentUserId() {
        try {
            const userStr = localStorage.getItem('finance_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user.id;
            }
        } catch (e) {
            console.error('[SyncService] Failed to get user ID:', e);
        }
        return null;
    }

    /**
     * Force a full sync (useful for first login or troubleshooting)
     */
    async forceFullSync() {
        // Clear last sync time to get all data
        await databaseService.setLastSyncTime(null);
        return this.sync();
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing
        };
    }

    /**
     * Get pending sync count
     */
    async getPendingCount() {
        const pending = await databaseService.getPendingSync();
        return pending.length;
    }

    /**
     * Subscribe to sync status changes
     */
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners() {
        const status = this.getStatus();
        this.listeners.forEach(cb => cb(status));
    }

    /**
     * Cleanup on logout
     */
    async cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        await databaseService.clearAllData();
    }
}

// Singleton instance
const syncService = new SyncService();
export default syncService;
