import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const TagsContext = createContext();

/**
 * TagsProvider - Global context for caching tags
 * Prevents repeated API calls on every component mount
 */
export function TagsProvider({ children }) {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTags = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/tags');
            // api.js does NOT auto-unwrap, so we need res.data.data
            setTags(res.data?.data || []);
        } catch (err) {
            console.error('[TagsContext] Error fetching tags:', err);
            setError(err.message);
            setTags([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    // Add a new tag and update cache
    const addTag = useCallback((newTag) => {
        setTags(prev => [...prev, newTag]);
    }, []);

    // Remove a tag from cache
    const removeTag = useCallback((tagId) => {
        setTags(prev => prev.filter(t => t.id !== tagId));
    }, []);

    // Force refresh tags from server
    const refreshTags = useCallback(() => {
        return fetchTags();
    }, [fetchTags]);

    const value = {
        tags,
        loading,
        error,
        addTag,
        removeTag,
        refreshTags
    };

    return (
        <TagsContext.Provider value={value}>
            {children}
        </TagsContext.Provider>
    );
}

/**
 * useTags - Hook to access cached tags
 * @returns {{ tags: Array, loading: boolean, error: string|null, addTag: Function, removeTag: Function, refreshTags: Function }}
 */
export function useTags() {
    const context = useContext(TagsContext);
    if (context === undefined) {
        throw new Error('useTags must be used within a TagsProvider');
    }
    return context;
}

export default TagsContext;
