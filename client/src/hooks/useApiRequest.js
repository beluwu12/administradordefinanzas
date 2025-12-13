/**
 * useApiRequest Hook
 * Centralized hook for API calls with loading, error, and data state management
 * 
 * Usage:
 * const { execute, loading, error, data } = useApiRequest(
 *   () => api.get('/tags'),
 *   { immediate: true }
 * );
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * @param {Function} apiCall - Function that returns a promise (API call)
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Execute immediately on mount
 * @param {Function} options.onSuccess - Callback on success
 * @param {Function} options.onError - Callback on error
 */
export function useApiRequest(apiCall, options = {}) {
    const { immediate = false, onSuccess, onError } = options;

    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall(...args);
            const result = response?.data ?? response;
            setData(result);

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            // err is already formatted by our axios interceptor
            const errorMessage = err.message || 'Ha ocurrido un error';
            setError(errorMessage);

            if (onError) {
                onError(err);
            }

            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall, onSuccess, onError]);

    // Execute immediately if requested
    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        execute,
        loading,
        error,
        data,
        setData,
        reset: () => {
            setLoading(false);
            setError(null);
            setData(null);
        }
    };
}

/**
 * Simple wrapper for one-time API calls
 * Returns the execute function directly
 */
export function useApiMutation(apiCall, options = {}) {
    const { onSuccess, onError } = options;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = useCallback(async (...args) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall(...args);
            const result = response?.data ?? response;

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            const errorMessage = err.message || 'Ha ocurrido un error';
            setError(errorMessage);

            if (onError) {
                onError(err);
            }

            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall, onSuccess, onError]);

    return {
        mutate,
        loading,
        error
    };
}

export default useApiRequest;
