'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { Home, Users, Map, FileText, Settings, LogOut, ChevronRight, Briefcase, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { user, logout } = useAuth();

    const navItems = [
        { label: 'Dashboard', icon: Home, href: '/dashboard' },
        { label: 'Tasks & Geofences', icon: Map, href: '/tasks' },
        { label: 'Users', icon: Users, href: '/users' },
        { label: 'HR & Payroll', icon: Users, href: '/hr' },
        { label: 'Field Reports', icon: FileText, href: '/reports' },
        { label: 'Audit', icon: ShieldCheck, href: '/audit' },
        { label: 'Settings', icon: Settings, href: '/settings' },
    ];

    return (
        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NGO_ADMIN', 'FIELD_COORDINATOR', 'HR_MANAGER', 'FINANCE_MANAGER']}>
            <div className="flex h-screen w-full bg-[#FAF9F6] overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-50">
                    <div className="p-6">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">FieldOps</h2>
                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 inline-block px-1.5 py-0.5 rounded">Admin Portal</div>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={`/admin${item.href}`}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-all font-bold group"
                                >
                                    <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span>{item.label}</span>
                                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-6 border-t border-slate-100">
                        <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm uppercase">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-slate-500 font-medium truncate">{user?.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold text-sm group"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200 flex items-center px-10 sticky top-0 z-40">
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Command Center</h1>

                        <div className="ml-auto flex items-center space-x-4">
                            <div className="bg-white border border-slate-200 rounded-full px-4 py-1.5 flex items-center shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">System Online</span>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto p-10">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
