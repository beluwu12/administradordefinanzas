/**
 * API Debugger — Development-only request/response logging
 * 
 * Features:
 * - Circular buffer of last 50 requests for diagnostics
 * - Performance timing per request
 * - Accessible from browser DevTools: window.__apiLog()
 * - Color-coded console output by status
 */

// Only active in development
const IS_DEV = import.meta.env.DEV;

export interface ApiLogEntry {
    id: number;
    timestamp: string;
    method: string;
    url: string;
    status: number | null;
    duration: number;
    requestSize: number;
    responseSize: number;
    error: string | null;
    requestHeaders: Record<string, string>;
    responseHeaders: Record<string, string>;
    requestBody: unknown;
    responseBody: unknown;
}

const MAX_ENTRIES = 50;
const logBuffer: ApiLogEntry[] = [];
let entryId = 0;

/**
 * Add a log entry to the circular buffer
 */
export const addLogEntry = (entry: Omit<ApiLogEntry, 'id'>): void => {
    if (!IS_DEV) return;

    const fullEntry: ApiLogEntry = { id: ++entryId, ...entry };
    logBuffer.push(fullEntry);
    if (logBuffer.length > MAX_ENTRIES) {
        logBuffer.shift();
    }

    // Console output with color coding
    const statusColor = !entry.status
        ? 'color: #ff4444; font-weight: bold'   // No response (network error)
        : entry.status < 300
            ? 'color: #4CAF50; font-weight: bold'   // 2xx green
            : entry.status < 400
                ? 'color: #FF9800; font-weight: bold'   // 3xx orange
                : entry.status < 500
                    ? 'color: #FF5722; font-weight: bold'   // 4xx red-orange
                    : 'color: #f44336; font-weight: bold';   // 5xx red

    const methodPad = entry.method.toUpperCase().padEnd(6);
    const durationStr = `${entry.duration}ms`.padStart(7);
    const statusStr = entry.status ? String(entry.status) : 'ERR';

    console.groupCollapsed(
        `%c[API] ${methodPad} ${statusStr} %c${durationStr}%c ${entry.url}`,
        statusColor,
        'color: #888',
        'color: inherit'
    );
    if (entry.requestBody && Object.keys(entry.requestBody as object).length > 0) {
        console.log('📤 Request:', entry.requestBody);
    }
    if (entry.responseBody) {
        console.log('📥 Response:', entry.responseBody);
    }
    if (entry.error) {
        console.error('❌ Error:', entry.error);
    }
    console.log('⏱️ Duration:', entry.duration, 'ms');
    console.groupEnd();
};

/**
 * Get all log entries (for DevTools inspection)
 */
export const getApiLog = (): ApiLogEntry[] => [...logBuffer];

/**
 * Get failed requests only
 */
export const getFailedRequests = (): ApiLogEntry[] =>
    logBuffer.filter(e => !e.status || e.status >= 400);

/**
 * Get slow requests (>2s)
 */
export const getSlowRequests = (): ApiLogEntry[] =>
    logBuffer.filter(e => e.duration > 2000);

/**
 * Clear the log buffer
 */
export const clearApiLog = (): void => {
    logBuffer.length = 0;
    entryId = 0;
};

/**
 * Get a summary of recent API activity
 */
export const getApiSummary = () => {
    const total = logBuffer.length;
    const failed = logBuffer.filter(e => !e.status || e.status >= 400).length;
    const avgDuration = total > 0
        ? Math.round(logBuffer.reduce((sum, e) => sum + e.duration, 0) / total)
        : 0;
    const slowest = total > 0
        ? logBuffer.reduce((max, e) => e.duration > max.duration ? e : max, logBuffer[0])
        : null;

    return {
        total,
        failed,
        successRate: total > 0 ? `${Math.round(((total - failed) / total) * 100)}%` : 'N/A',
        avgDuration: `${avgDuration}ms`,
        slowest: slowest ? { url: slowest.url, duration: `${slowest.duration}ms` } : null,
    };
};

// Expose to DevTools console in development
if (IS_DEV && typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>;
    w.__apiLog = getApiLog;
    w.__apiSummary = getApiSummary;
    w.__apiFailed = getFailedRequests;
    w.__apiSlow = getSlowRequests;
    w.__apiClear = clearApiLog;

    console.log(
        '%c🔍 API Debugger Active%c\n' +
        'Use these commands in DevTools:\n' +
        '  __apiLog()     — All recent requests\n' +
        '  __apiSummary() — Quick stats\n' +
        '  __apiFailed()  — Failed requests only\n' +
        '  __apiSlow()    — Slow requests (>2s)\n' +
        '  __apiClear()   — Clear log',
        'color: #4CAF50; font-size: 14px; font-weight: bold',
        'color: #888; font-size: 11px'
    );
}
