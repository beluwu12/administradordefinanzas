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
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Initialize user state from localStorage (valid pattern for initialization)
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser(parsedUser);
                // Set default header
                axios.defaults.headers.common['x-user-id'] = parsedUser.id;
            } catch (e) {
                console.error("Error parsing stored user", e);
                localStorage.removeItem('finance_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('finance_user', JSON.stringify(userData));
        axios.defaults.headers.common['x-user-id'] = userData.id;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('finance_user');
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
