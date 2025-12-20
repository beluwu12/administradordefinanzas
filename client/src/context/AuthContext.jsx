import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize: Check localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('finance_user');
        const token = localStorage.getItem('finance_token');

        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                // Set JWT authorization header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (e) {
                console.error("Error parsing stored user", e);
                localStorage.removeItem('finance_user');
                localStorage.removeItem('finance_token');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('finance_user', JSON.stringify(userData));

        if (token) {
            localStorage.setItem('finance_token', token);
            // Set JWT authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('finance_user');
        localStorage.removeItem('finance_token');
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

