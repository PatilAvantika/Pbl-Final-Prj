'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useAuth, type User as AuthUser } from '@/context/AuthContext';
import Link from 'next/link';
import { Mail, Lock, User, Briefcase, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import type { Role } from '@/types/role';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'VOLUNTEER' as Role, // Default role
    });

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Create user data directly mapping to Prisma model
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            };

            const response = await api.post<{ user: AuthUser }>('/auth/register', payload);
            const user = response.data?.user;
            if (!user?.id || !user?.role) {
                setError(
                    'Registration returned an incomplete profile. Try signing in, or contact support.',
                );
                return;
            }
            login(user);
        } catch (err: unknown) {
            const pc = (err as { response?: { data?: { prismaCode?: string } } }).response?.data
                ?.prismaCode;
            const prismaCode = typeof pc === 'string' ? pc : undefined;
            const base = getApiErrorMessage(
                err,
                'Registration failed. If the problem persists, from the backend folder run: npx prisma migrate deploy',
            );
            const suffix =
                prismaCode && !base.includes(prismaCode) ? ` (${prismaCode})` : '';
            setError(`${base}${suffix}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 py-12 relative overflow-hidden bg-slate-50">
            {/* Decorative background blobs */}
            <div className="absolute top-20 -left-10 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 -right-10 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="w-full max-w-lg relative z-10 perspective-1000">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 sm:p-10 transform transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white mb-6 shadow-lg shadow-sky-500/20 transform hover:scale-105 transition-transform duration-300">
                            <User className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create Account</h1>
                        <p className="text-slate-500 mt-2 font-medium">Join FieldOps to track your impact</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start text-sm font-medium border border-red-100 mb-4">
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">First Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-3 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                        placeholder="Jane"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder="jane.doe@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Role</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="VOLUNTEER">Volunteer</option>
                                    <option value="DONOR">Donor</option>
                                    <option value="STAFF">Field Staff</option>
                                    <option value="TEAM_LEADER">Team Leader</option>
                                    <option value="FIELD_COORDINATOR">Field Coordinator</option>
                                    <option value="HR_MANAGER">HR Manager</option>
                                    <option value="FINANCE_MANAGER">Finance Manager</option>
                                    <option value="NGO_ADMIN">NGO Admin</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder="Create a strong password"
                                    required
                                    minLength={8}
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 pl-1 mt-1">
                                At least 8 characters, with at least one letter and one number.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-4 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 mt-6 group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm font-medium text-slate-500 border-t border-slate-100 pt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
