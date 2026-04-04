'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api, { setApiToken } from '../lib/axios';

// Define the User and AuthContext types
export type Role =
    | 'SUPER_ADMIN'
    | 'NGO_ADMIN'
    | 'HR_MANAGER'
    | 'FINANCE_MANAGER'
    | 'FIELD_COORDINATOR'
    | 'TEAM_LEADER'
    | 'VOLUNTEER'
    | 'STAFF';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                api.get('/auth/profile')
                    .then((res) => {
                        setUser(res.data);
                        localStorage.setItem('user', JSON.stringify(res.data));
                    })
                    .catch(() => {
                        setUser(null);
                        localStorage.removeItem('user');
                    })
                    .finally(() => setLoading(false));
                return;
            } catch (e) {
                console.error('Failed to parse user info', e);
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setApiToken(newToken);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // Determine dashboard redirection based on role
        if (userData.role === 'SUPER_ADMIN' || userData.role === 'NGO_ADMIN') {
            router.push('/admin/dashboard');
        } else if (userData.role === 'VOLUNTEER') {
            router.push('/volunteer/dashboard');
        } else {
            router.push('/admin/dashboard');
        }
    };

    const logout = () => {
        api.post('/auth/logout').catch(() => null);
        setApiToken(null);
        setToken(null);
        setUser(null);
        localStorage.removeItem('user');

        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
