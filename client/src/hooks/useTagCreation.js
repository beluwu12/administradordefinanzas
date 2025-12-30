/**
 * useTagCreation - Custom hook for tag creation
 * Extracts tag creation logic from TransactionForm (SRP)
 */

import { useState, useCallback } from 'react';
import api from '../api';
import { useTags } from '../context/TagsContext';

/**
 * Hook for creating tags with loading and error states
 * @returns {{ createTag: Function, isCreating: boolean, error: string|null, clearError: Function }}
 */
export const useTagCreation = () => {
    const { addTag } = useTags();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);

    const clearError = useCallback(() => setError(null), []);

    /**
     * Create a new tag
     * @param {string} name - Tag name
     * @param {string} color - Tag color (default: 'blue')
     * @returns {Promise<{id: string, name: string, color: string}|null>} - Created tag or null on error
     */
    const createTag = useCallback(async (name, color = 'blue') => {
        if (!name || !name.trim()) {
            setError('El nombre de la etiqueta es requerido');
            return null;
        }

        setIsCreating(true);
        setError(null);

        try {
            const res = await api.post('/tags', { name: name.trim(), color });
            // API returns {success, data: {...}} so unwrap correctly
            const newTag = res.data?.data || res.data;

            if (newTag && newTag.id) {
                addTag(newTag);
                return newTag;
            } else {
                console.error('[useTagCreation] Invalid response:', res.data);
                setError('Error al crear la etiqueta');
                return null;
            }
        } catch (err) {
            console.error('[useTagCreation] Error:', err);
            // Handle 409 Conflict (duplicate tag)
            if (err.status === 409 || err.code === 'DUPLICATE') {
                setError('Esta etiqueta ya existe');
            } else {
                const errorMsg = err.message || 'Error al crear la etiqueta';
                setError(errorMsg);
            }
            return null;
        } finally {
            setIsCreating(false);
        }
    }, [addTag]);

    return {
        createTag,
        isCreating,
        error,
        clearError
    };
};

export default useTagCreation;
