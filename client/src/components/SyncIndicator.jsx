/**
 * SyncIndicator - Visual indicator for offline/sync status
 * 
 * Shows:
 * - Offline badge when disconnected
 * - Syncing animation when syncing
 * - Pending count when there are unsynced changes
 */

import React from 'react';
import { useSyncStatus } from '../hooks/useOfflineData';

export function SyncIndicator() {
    const { isOnline, isSyncing, pendingCount, sync, isNative } = useSyncStatus();

    // Don't show on web
    if (!isNative) return null;

    return (
        <div className="sync-indicator">
            {!isOnline && (
                <div className="sync-badge offline">
                    <span className="material-symbols-outlined">cloud_off</span>
                    <span>Sin conexión</span>
                </div>
            )}

            {isOnline && isSyncing && (
                <div className="sync-badge syncing">
                    <span className="material-symbols-outlined spinning">sync</span>
                    <span>Sincronizando...</span>
                </div>
            )}

            {isOnline && !isSyncing && pendingCount > 0 && (
                <button
                    className="sync-badge pending"
                    onClick={sync}
                >
                    <span className="material-symbols-outlined">cloud_upload</span>
                    <span>{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
                </button>
            )}

            <style>{`
        .sync-indicator {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 1000;
        }

        .sync-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .sync-badge .material-symbols-outlined {
          font-size: 18px;
        }

        .sync-badge.offline {
          background: #424242;
          color: #fff;
        }

        .sync-badge.syncing {
          background: #1976d2;
          color: #fff;
        }

        .sync-badge.pending {
          background: #f57c00;
          color: #fff;
          border: none;
          cursor: pointer;
        }

        .sync-badge.pending:hover {
          background: #ef6c00;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default SyncIndicator;
