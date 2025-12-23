/**
 * Date Utilities - Centralized date handling
 * Prevents timezone issues across the application
 */

/**
 * Convert a local datetime string to UTC ISO string
 * Handles edge cases: null, undefined, invalid dates
 * 
 * @param {string|null|undefined} localDateString - Local datetime string (e.g., "2023-10-27T08:30:00")
 * @returns {string} - UTC ISO string (e.g., "2023-10-27T12:30:00.000Z")
 */
export const toUTCISOString = (localDateString) => {
    // Handle null/undefined - return current time
    if (!localDateString) {
        return new Date().toISOString();
    }

    try {
        const date = new Date(localDateString);

        // Check for Invalid Date
        if (isNaN(date.getTime())) {
            console.warn('[dateUtils] Invalid date string:', localDateString);
            return new Date().toISOString();
        }

        return date.toISOString();
    } catch (error) {
        console.error('[dateUtils] Error converting date:', error);
        return new Date().toISOString();
    }
};

/**
 * Get current local datetime string for form inputs
 * Format: "YYYY-MM-DDTHH:mm:ss" (no timezone, for datetime-local inputs)
 * 
 * @returns {string} - Local datetime string
 */
export const getCurrentLocalDatetime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 19);
};

/**
 * Convert UTC date from server to local datetime string for form editing
 * 
 * @param {string} utcDateString - UTC ISO string from server
 * @returns {string} - Local datetime string for form inputs
 */
export const utcToLocalDatetime = (utcDateString) => {
    if (!utcDateString) return getCurrentLocalDatetime();

    try {
        const date = new Date(utcDateString);
        if (isNaN(date.getTime())) return getCurrentLocalDatetime();

        // Convert to local timezone
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 19);
    } catch (error) {
        console.error('[dateUtils] Error converting UTC to local:', error);
        return getCurrentLocalDatetime();
    }
};
