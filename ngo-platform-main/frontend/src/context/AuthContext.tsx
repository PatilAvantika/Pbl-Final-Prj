'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';
import axios from 'axios';
import { getDefaultRouteForRole } from '../lib/role-routing';
import { getVolunteerEntryPath } from '../lib/onboarding';
import type { Role } from '../types/role';

export type { Role };

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    phone?: string | null;
    department?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    onboardingProfileComplete?: boolean;
    onboardingFaceComplete?: boolean;
    onboardingAttendanceIntroComplete?: boolean;
    faceEnrollmentSampleCount?: number;
}

interface AuthContextType {
    user: User | null;
    /** True while initial session resolution runs (splash — avoids auth UI flicker). */
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeApiBase(raw?: string): string {
    const u = (raw || 'http://localhost:3002').replace(/\/$/, '');
    if (u.endsWith('/api/v1')) return u;
    return `${u}/api/v1`;
}

const baseURL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);

async function tryRefreshSession(): Promise<boolean> {
    try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true, timeout: 15_000 });
        return true;
    } catch {
        return false;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        try {
            const { data } = await api.get<User>('/auth/me');
            setUser(data);
        } catch {
            const refreshed = await tryRefreshSession();
            if (refreshed) {
                try {
                    const { data } = await api.get<User>('/auth/me');
                    setUser(data);
                    return;
                } catch {
                    /* fall through */
                }
            }
            setUser(null);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                await refreshUser();
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshUser]);

    const login = useCallback(
        (userData: User) => {
            setUser(userData);
            if (userData.role === 'VOLUNTEER') {
                router.push(getVolunteerEntryPath(userData));
                return;
            }
            router.push(getDefaultRouteForRole(userData.role));
        },
        [router],
    );

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            /* still clear client session */
        }
        setUser(null);
        router.push('/login');
    }, [router]);

    const value = useMemo(
        () => ({
            user,
            isLoading,
            isAuthenticated: Boolean(user),
            login,
            logout,
            refreshUser,
        }),
        [user, isLoading, login, logout, refreshUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
