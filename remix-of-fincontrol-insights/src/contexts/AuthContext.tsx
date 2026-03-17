/**
 * Authentication Context
 * Provides auth state and functions across the app
 * 
 * Key design: isInitializing (mount session check) is separate from
 * isLoggingIn (form submission) to prevent button blocking bugs.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, clearAuth, isAuthenticated as checkAuth } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    currency?: string;
    country?: string;
    dualCurrencyEnabled?: boolean;
    language?: string;
    theme?: string;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country?: string;
    dualCurrencyEnabled?: boolean;
    language?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    /** True while checking existing session on mount */
    isInitializing: boolean;
    /** True while login/register API call is in progress */
    isLoggingIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    error: string | null;
    /** @deprecated Use isInitializing or isLoggingIn instead */
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INIT_TIMEOUT_MS = 10_000; // 10s timeout for session check

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper: transform backend user response to frontend User
    const mapUser = useCallback((profile: {
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        defaultCurrency?: string;
        country?: string;
        dualCurrencyEnabled?: boolean;
        language?: string;
        theme?: string;
    }): User => ({
        id: profile.id,
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'Usuario',
        email: profile.email,
        currency: profile.defaultCurrency,
        country: profile.country,
        dualCurrencyEnabled: profile.dualCurrencyEnabled,
        language: profile.language,
        theme: profile.theme,
    }), []);

    // Check for existing session on mount
    useEffect(() => {
        let didTimeout = false;

        const initAuth = async () => {
            if (checkAuth()) {
                try {
                    const profile = await authApi.getProfile();
                    if (!didTimeout) {
                        setUser(mapUser(profile));
                    }
                } catch {
                    // Token expired or invalid — clean up
                    clearAuth();
                }
            }
            if (!didTimeout) {
                setIsInitializing(false);
            }
        };

        // Safety timeout: if initAuth hangs, stop blocking the UI
        const timer = setTimeout(() => {
            didTimeout = true;
            setIsInitializing(false);
            clearAuth();
        }, INIT_TIMEOUT_MS);

        initAuth().finally(() => clearTimeout(timer));
    }, [mapUser]);

    const login = async (email: string, password: string) => {
        setError(null);
        setIsLoggingIn(true);
        try {
            const response = await authApi.login({ email, password });
            setUser(mapUser(response.user));
        } catch (err: unknown) {
            // Read error message directly from the caught error (not stale state)
            const message = err instanceof Error
                ? err.message
                : typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as { message: string }).message)
                    : 'Error de inicio de sesión';
            setError(message);
            throw err; // Re-throw so Login.tsx catch block can handle it too
        } finally {
            setIsLoggingIn(false);
        }
    };

    const register = async (data: RegisterData) => {
        setError(null);
        setIsLoggingIn(true);
        try {
            const response = await authApi.register(data);
            setUser(mapUser(response.user));
        } catch (err: unknown) {
            const message = err instanceof Error
                ? err.message
                : typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as { message: string }).message)
                    : 'Error al registrar';
            setError(message);
            throw err;
        } finally {
            setIsLoggingIn(false);
        }
    };

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    const logout = async () => {
        try {
            // Revoke session on the backend (invalidates refresh token)
            await authApi.logout();
        } catch {
            // If the API call fails (e.g., already expired), still clean up locally
        } finally {
            clearAuth();
            setUser(null);
            setError(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isInitializing,
                isLoggingIn,
                login,
                register,
                logout,
                updateUser,
                error,
                // Backwards compat: isLoading = true if either initializing or logging in
                isLoading: isInitializing || isLoggingIn,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
