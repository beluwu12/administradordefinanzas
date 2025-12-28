/**
 * AuthContext - Authentication state management
 * 
 * FIX: Consolidated token handling. Uses only the custom api instance,
 * NOT axios.defaults (which was causing dual-token issues)
 * 
 * Token is stored in localStorage and attached via api.js interceptor
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api, { unwrapData } from '../api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearAuthData = useCallback(() => {
        localStorage.removeItem('finance_user');
        localStorage.removeItem('finance_token');
        // refresh token is in httpOnly cookie - cleared by server on logout
        setUser(null);
    }, []);

    // Initialize: Check localStorage for existing session
    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('finance_user');
            const token = localStorage.getItem('finance_token');

            if (storedUser && token) {
                try {
                    // Validate token is still valid by calling /me
                    const response = await api.get('/auth/me');

                    // Token valid, update user with fresh data
                    const userData = unwrapData(response);
                    if (userData) {
                        setUser(userData);
                        localStorage.setItem('finance_user', JSON.stringify(userData));
                    } else {
                        clearAuthData();
                    }
                } catch {
                    // Token expired or invalid
                    clearAuthData();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [clearAuthData]);

    const login = useCallback((userData, token) => {
        if (!userData || !token) {
            console.error('[AuthContext] login called with missing userData or token');
            return;
        }

        // Store in localStorage (api.js interceptor will pick it up)
        localStorage.setItem('finance_user', JSON.stringify(userData));
        localStorage.setItem('finance_token', token);
        // refresh token is set via httpOnly cookie by server - not stored here

        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        // Call server to clear httpOnly cookie
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // Ignore logout errors
        }
        clearAuthData();
    }, [clearAuthData]);

    const updateUser = useCallback((updates) => {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('finance_user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const value = {
        user,
        login,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
