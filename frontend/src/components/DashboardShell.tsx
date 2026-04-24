'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export type DashboardNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

type ShellAccent = 'emerald' | 'amber';

const accentStyles: Record<
    ShellAccent,
    {
        iconBg: string;
        badge: string;
        activeNav: string;
        idleNav: string;
        pulse: string;
    }
> = {
    emerald: {
        iconBg: 'from-emerald-500 to-teal-400 shadow-emerald-500/20',
        badge: 'text-emerald-600 bg-emerald-50',
        activeNav: 'bg-emerald-50 text-emerald-700',
        idleNav: 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600',
        pulse: 'bg-emerald-500',
    },
    amber: {
        iconBg: 'from-amber-500 to-orange-400 shadow-amber-500/25',
        badge: 'text-amber-800 bg-amber-50',
        activeNav: 'bg-amber-50 text-amber-900',
        idleNav: 'text-slate-600 hover:bg-slate-50 hover:text-amber-700',
        pulse: 'bg-amber-500',
    },
};

type DashboardShellProps = {
    brandTitle: string;
    brandSubtitle: string;
    brandIcon: LucideIcon;
    navItems: DashboardNavItem[];
    headerTitle: string;
    children: ReactNode;
    /** When set, this nav href only matches exactly (e.g. /team-leader vs /team-leader/tasks). */
    navHomeHref?: string;
    /** Sidebar / nav accent (donor portal uses amber). */
    accent?: ShellAccent;
};

export function DashboardShell({
    brandTitle,
    brandSubtitle,
    brandIcon: BrandIcon,
    navItems,
    headerTitle,
    children,
    navHomeHref,
    accent = 'emerald',
}: DashboardShellProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const a = accentStyles[accent];

    return (
        <div className="flex h-screen w-full bg-[#FAF9F6] overflow-hidden">
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-50">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div
                            className={cn(
                                'w-10 h-10 rounded-xl bg-gradient-to-tr text-white flex items-center justify-center shadow-md',
                                a.iconBg,
                            )}
                        >
                            <BrandIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">{brandTitle}</h2>
                            <div
                                className={cn(
                                    'text-[10px] font-bold uppercase tracking-widest inline-block px-1.5 py-0.5 rounded',
                                    a.badge,
                                )}
                            >
                                {brandSubtitle}
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const active =
                                navHomeHref && item.href === navHomeHref
                                    ? pathname === navHomeHref || pathname === `${navHomeHref}/`
                                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <button
                                    key={item.href}
                                    type="button"
                                    onClick={() => {
                                        console.log(`Clicked ${item.label}`);
                                        router.push(item.href);
                                    }}
                                    className={cn(
                                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold group text-left relative z-50',
                                        active ? a.activeNav : a.idleNav,
                                    )}
                                >
                                    <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span>{item.label}</span>
                                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100">
                    <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm uppercase">
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-slate-500 font-medium truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void logout()}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold text-sm group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200 flex items-center px-6 md:px-10 sticky top-0 z-40 shrink-0">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{headerTitle}</h1>
                    <div className="ml-auto flex items-center space-x-4">
                        <div className="bg-white border border-slate-200 rounded-full px-4 py-1.5 flex items-center shadow-sm">
                            <span className={cn('w-2 h-2 rounded-full mr-2 animate-pulse', a.pulse)} />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Online</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 md:p-10 bg-background text-foreground">{children}</div>
            </main>
        </div>
    );
}
