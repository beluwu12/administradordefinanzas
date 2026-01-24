/**
 * Authentication Context
 * Provides auth state and functions across the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            if (checkAuth()) {
                try {
                    const profile = await authApi.getProfile();
                    setUser({
                        id: profile.id,
                        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'Usuario',
                        email: profile.email,
                        currency: profile.defaultCurrency,
                        country: profile.country,
                        dualCurrencyEnabled: profile.dualCurrencyEnabled,
                        language: profile.language,
                        theme: profile.theme,
                    });
                } catch {
                    // Token expired or invalid
                    clearAuth();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await authApi.login({ email, password });
            setUser({
                id: response.user.id,
                name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email || 'Usuario',
                email: response.user.email,
                currency: response.user.defaultCurrency,
                country: response.user.country,
                dualCurrencyEnabled: response.user.dualCurrencyEnabled,
                language: response.user.language,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error de inicio de sesión';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await authApi.register(data);
            setUser({
                id: response.user.id,
                name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email || 'Usuario',
                email: response.user.email,
                currency: response.user.defaultCurrency,
                country: response.user.country,
                dualCurrencyEnabled: response.user.dualCurrencyEnabled,
                language: response.user.language,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al registrar';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    const logout = () => {
        clearAuth();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                updateUser,
                error,
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
