/**
 * AuthContext - Authentication state management
 * 
 * FIX: Consolidated token handling. Uses only the custom api instance,
 * NOT axios.defaults (which was causing dual-token issues)
 * 
 * Token is stored in localStorage and attached via api.js interceptor
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';

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
        localStorage.removeItem('finance_refresh_token');
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

                    if (response.data) {
                        // Token valid, update user with fresh data
                        setUser(response.data);
                        localStorage.setItem('finance_user', JSON.stringify(response.data));
                    } else {
                        // Token invalid, clear storage
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

    const login = useCallback((userData, token, refreshToken = null) => {
        if (!userData || !token) {
            console.error('[AuthContext] login called with missing userData or token');
            return;
        }

        // Store in localStorage (api.js interceptor will pick it up)
        localStorage.setItem('finance_user', JSON.stringify(userData));
        localStorage.setItem('finance_token', token);

        // Store refresh token if provided
        if (refreshToken) {
            localStorage.setItem('finance_refresh_token', refreshToken);
        }

        setUser(userData);
    }, []);

    const logout = useCallback(() => {
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
