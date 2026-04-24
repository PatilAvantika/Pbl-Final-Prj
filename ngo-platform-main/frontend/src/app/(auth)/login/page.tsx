'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useAuth, type User } from '../../../context/AuthContext';
import type { Role } from '@/types/role';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api/client';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

function LoginPageContent() {
    const [email, setEmail] = useState('testuser1@gmail.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const selectedPortal = searchParams.get('role');

    const portalConfig = useMemo(() => {
        const byPortal: Record<string, { title: string; allowedRoles: Role[]; email: string; password: string }> = {
            admin: {
                title: 'Admin Login',
                allowedRoles: ['SUPER_ADMIN', 'NGO_ADMIN', 'FIELD_COORDINATOR', 'HR_MANAGER', 'FINANCE_MANAGER'],
                email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? '',
                password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ?? '',
            },
            'team-leader': {
                title: 'Team Leader Login',
                allowedRoles: ['TEAM_LEADER'],
                email: process.env.NEXT_PUBLIC_DEMO_TEAM_LEADER_EMAIL ?? '',
                password: process.env.NEXT_PUBLIC_DEMO_TEAM_LEADER_PASSWORD ?? '',
            },
            volunteer: {
                title: 'Volunteer Login',
                allowedRoles: ['VOLUNTEER'],
                email: process.env.NEXT_PUBLIC_DEMO_VOLUNTEER_EMAIL ?? '',
                password: process.env.NEXT_PUBLIC_DEMO_VOLUNTEER_PASSWORD ?? '',
            },
            staff: {
                title: 'Staff Login',
                allowedRoles: ['STAFF'],
                email: process.env.NEXT_PUBLIC_DEMO_STAFF_EMAIL ?? '',
                password: process.env.NEXT_PUBLIC_DEMO_STAFF_PASSWORD ?? '',
            },
            donor: {
                title: 'Donor Login',
                allowedRoles: ['DONOR'],
                email: process.env.NEXT_PUBLIC_DEMO_DONOR_EMAIL ?? '',
                password: process.env.NEXT_PUBLIC_DEMO_DONOR_PASSWORD ?? '',
            },
        };
        return selectedPortal ? byPortal[selectedPortal] : null;
    }, [selectedPortal]);

    useEffect(() => {
        if (portalConfig) {
            setEmail(portalConfig.email);
            setPassword(portalConfig.password);
        }
    }, [portalConfig]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<{ user: User }>('/auth/login', { email, password });
            const { user } = response.data;
            if (portalConfig && !portalConfig.allowedRoles.includes(user.role as Role)) {
                setError(`This account is not allowed in ${portalConfig.title}. Please use the correct portal.`);
                return;
            }
            login(user);
            // Redirection is handled in login context based on role
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Decorative background blobs */}
            <div className="absolute top-0 -left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-10 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-10 left-32 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md relative z-10 perspective-1000">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 sm:p-10 transform transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white mb-6 shadow-lg shadow-emerald-500/20 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            {portalConfig ? portalConfig.title : 'Welcome Back'}
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {portalConfig ? 'Sign in with your role-specific account' : 'Log in to FieldOps Platform'}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 flex justify-between">
                                <span>Password</span>
                                <Link href="/forgot" className="text-emerald-600 hover:text-emerald-700 normal-case tracking-normal">Forgot?</Link>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-4 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 mt-6 group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-slate-500 border-t border-slate-100 pt-6">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-bold ml-1 transition-colors">
                            Request access
                        </Link>
                    </div>
                    <div className="mt-4 text-center text-xs font-semibold text-slate-500">
                        <Link href="/" className="hover:text-emerald-600 transition-colors">
                            Back to Landing
                        </Link>
                    </div>
                    {portalConfig && portalConfig.email ? (
                        <div className="mt-3 text-center text-xs text-slate-500 font-medium">
                            Demo fields pre-filled from environment. Clear and use your own account anytime.
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-slate-50">Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    );
}
