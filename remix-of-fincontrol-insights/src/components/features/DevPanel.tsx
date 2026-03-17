/**
 * DevPanel — Development-only debug panel
 * 
 * Shows auth state, last API calls, and context state
 * Only renders in development mode (import.meta.env.DEV)
 * Toggle with Ctrl+Shift+D
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getToken } from '@/lib/api/client';
import { getApiLog, getApiSummary, clearApiLog, type ApiLogEntry } from '@/lib/api/debugger';

// Only render in development
const IS_DEV = import.meta.env.DEV;

const DevPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'auth' | 'api' | 'state'>('api');
    const [logEntries, setLogEntries] = useState<ApiLogEntry[]>([]);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const { user, isAuthenticated, isLoading } = useAuth();
    const { language } = useLanguage();

    // Keyboard shortcut: Ctrl+Shift+D
    useEffect(() => {
        if (!IS_DEV) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Refresh log entries
    const refreshLog = useCallback(() => {
        setLogEntries(getApiLog());
        setRefreshCounter(c => c + 1);
    }, []);

    useEffect(() => {
        if (isOpen) refreshLog();
    }, [isOpen, refreshLog]);

    // Auto-refresh every 2 seconds when panel is open
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(refreshLog, 2000);
        return () => clearInterval(interval);
    }, [isOpen, refreshLog]);

    if (!IS_DEV) return null;

    // Token info
    const token = getToken();
    const tokenInfo = token ? (() => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = new Date(payload.exp * 1000);
            const now = new Date();
            const remaining = Math.round((exp.getTime() - now.getTime()) / 1000);
            return {
                userId: payload.id?.substring(0, 8) + '...',
                type: payload.type,
                expiresAt: exp.toLocaleTimeString(),
                remaining: remaining > 0 ? `${remaining}s` : 'EXPIRED',
                isExpired: remaining <= 0,
            };
        } catch {
            return { error: 'Invalid token' };
        }
    })() : null;

    const summary = getApiSummary();

    const statusColor = (status: number | null) => {
        if (!status) return '#f44336';
        if (status < 300) return '#4CAF50';
        if (status < 400) return '#FF9800';
        return '#f44336';
    };

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '12px', right: '12px', zIndex: 99999,
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: isOpen ? '#f44336' : '#4CAF50',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                }}
                title="Dev Panel (Ctrl+Shift+D)"
            >
                {isOpen ? '✕' : '🔍'}
            </button>

            {/* Panel */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: '60px', right: '12px', zIndex: 99998,
                    width: '420px', maxHeight: '70vh',
                    background: '#1a1a2e', color: '#e0e0e0',
                    borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    fontFamily: 'monospace', fontSize: '12px',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '10px 14px', background: '#16213e',
                        borderBottom: '1px solid #333',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>🔍 Dev Panel</span>
                        <span style={{ color: '#888', fontSize: '10px' }}>
                            {summary.total} calls • {summary.successRate} success • avg {summary.avgDuration}
                        </span>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                        {(['api', 'auth', 'state'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                                background: activeTab === tab ? '#0f3460' : 'transparent',
                                color: activeTab === tab ? '#e94560' : '#888',
                                fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold',
                                textTransform: 'uppercase',
                            }}>
                                {tab === 'api' ? '📡 API' : tab === 'auth' ? '🔑 Auth' : '⚡ State'}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px' }} key={refreshCounter}>
                        {activeTab === 'api' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <button onClick={refreshLog} style={btnStyle}>↻ Refresh</button>
                                    <button onClick={() => { clearApiLog(); refreshLog(); }} style={btnStyle}>🗑 Clear</button>
                                </div>
                                {logEntries.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                        No API calls yet
                                    </div>
                                ) : (
                                    [...logEntries].reverse().map(entry => (
                                        <div key={entry.id} style={{
                                            padding: '6px 8px', marginBottom: '4px',
                                            background: '#16213e', borderRadius: '6px',
                                            borderLeft: `3px solid ${statusColor(entry.status)}`,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>
                                                    <span style={{ color: '#e94560', fontWeight: 'bold' }}>{entry.method}</span>
                                                    {' '}
                                                    <span style={{ color: statusColor(entry.status), fontWeight: 'bold' }}>
                                                        {entry.status || 'ERR'}
                                                    </span>
                                                    {' '}
                                                    <span style={{ color: '#aaa' }}>{entry.url.replace(/^https?:\/\/[^/]+/, '')}</span>
                                                </span>
                                                <span style={{ color: '#666' }}>{entry.duration}ms</span>
                                            </div>
                                            {entry.error && (
                                                <div style={{ color: '#f44336', fontSize: '10px', marginTop: '2px' }}>
                                                    ❌ {entry.error}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === 'auth' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={cardStyle}>
                                    <div style={labelStyle}>Status</div>
                                    <div style={{
                                        color: isAuthenticated ? '#4CAF50' : '#f44336',
                                        fontWeight: 'bold'
                                    }}>
                                        {isLoading ? '⏳ Loading...' : isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}
                                    </div>
                                </div>

                                {user && (
                                    <div style={cardStyle}>
                                        <div style={labelStyle}>User</div>
                                        <div>{user.name} ({user.email})</div>
                                        <div style={{ color: '#888', fontSize: '10px' }}>ID: {user.id}</div>
                                    </div>
                                )}

                                {tokenInfo && (
                                    <div style={cardStyle}>
                                        <div style={labelStyle}>Access Token</div>
                                        {'error' in tokenInfo ? (
                                            <div style={{ color: '#f44336' }}>{tokenInfo.error}</div>
                                        ) : (
                                            <>
                                                <div>Type: {tokenInfo.type}</div>
                                                <div>User: {tokenInfo.userId}</div>
                                                <div>Expires: {tokenInfo.expiresAt}</div>
                                                <div style={{ color: tokenInfo.isExpired ? '#f44336' : '#4CAF50', fontWeight: 'bold' }}>
                                                    {tokenInfo.isExpired ? '⚠️ EXPIRED' : `⏱ ${tokenInfo.remaining} remaining`}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        localStorage.removeItem('finance_token');
                                        localStorage.removeItem('finance_refresh');
                                        window.location.href = '/login';
                                    }}
                                    style={{ ...btnStyle, color: '#f44336', borderColor: '#f44336' }}
                                >
                                    🚪 Force Logout
                                </button>
                            </div>
                        )}

                        {activeTab === 'state' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={cardStyle}>
                                    <div style={labelStyle}>Language</div>
                                    <div>{language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</div>
                                </div>

                                <div style={cardStyle}>
                                    <div style={labelStyle}>LocalStorage</div>
                                    {Object.keys(localStorage)
                                        .filter(k => k.startsWith('fin'))
                                        .map(key => (
                                            <div key={key} style={{ fontSize: '10px', color: '#aaa' }}>
                                                {key}: {(localStorage.getItem(key) || '').substring(0, 30)}...
                                            </div>
                                        ))
                                    }
                                </div>

                                <div style={cardStyle}>
                                    <div style={labelStyle}>API URL</div>
                                    <div style={{ color: '#4CAF50' }}>{import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}</div>
                                </div>

                                <div style={cardStyle}>
                                    <div style={labelStyle}>Environment</div>
                                    <div>Mode: {import.meta.env.MODE}</div>
                                    <div>Dev: {String(import.meta.env.DEV)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

// Shared styles
const btnStyle: React.CSSProperties = {
    background: 'transparent', border: '1px solid #444',
    color: '#aaa', padding: '4px 10px', borderRadius: '4px',
    cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px',
};

const cardStyle: React.CSSProperties = {
    background: '#16213e', borderRadius: '8px', padding: '10px',
};

const labelStyle: React.CSSProperties = {
    color: '#e94560', fontWeight: 'bold', fontSize: '10px',
    textTransform: 'uppercase', marginBottom: '4px',
    letterSpacing: '0.5px',
};

export default DevPanel;
