import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('greenmark_user');
        const storedAdmin = localStorage.getItem('greenmark_admin');
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedAdmin) setAdmin(JSON.parse(storedAdmin));
        setLoading(false);
    }, []);

    const login = (userData) => {
        if (userData.role === 'admin') {
            setAdmin(userData);
            localStorage.setItem('greenmark_admin', JSON.stringify(userData));
        } else {
            setUser(userData);
            localStorage.setItem('greenmark_user', JSON.stringify(userData));
        }
    };

    const logout = (role = 'user') => {
        if (role === 'admin') {
            setAdmin(null);
            localStorage.removeItem('greenmark_admin');
        } else {
            setUser(null);
            localStorage.removeItem('greenmark_user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, admin, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
