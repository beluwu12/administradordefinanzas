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

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                // Always set x-user-id for backend auth
                axios.defaults.headers.common['x-user-id'] = parsedUser.id;
                // Also set token if available
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
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

        // Always set x-user-id header (required by backend)
        axios.defaults.headers.common['x-user-id'] = userData.id;

        if (token) {
            localStorage.setItem('finance_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('finance_user');
        localStorage.removeItem('finance_token');
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['x-user-id'];
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
