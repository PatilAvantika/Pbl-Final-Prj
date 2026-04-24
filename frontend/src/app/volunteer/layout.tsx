'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Clock, FileText, UserCircle } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { needsVolunteerOnboarding } from '../../lib/onboarding';
import { FieldAssistantChat } from '@/features/intelligence/components/FieldAssistantChat';

const NAV_ITEMS = [
    { href: '/volunteer/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/volunteer/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/volunteer/attendance', label: 'Attend', icon: Clock },
    { href: '/volunteer/reports', label: 'Reports', icon: FileText },
    { href: '/volunteer/profile', label: 'Profile', icon: UserCircle },
];

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const hideNav = pathname.endsWith('/camera');

    useEffect(() => {
        if (isLoading || !user) return;
        if (needsVolunteerOnboarding(user)) {
            router.replace('/onboarding');
        }
    }, [user, isLoading, router]);

    const isActive = (href: string) => {
        if (href === '/volunteer/dashboard') return pathname === href;
        // Task list tab also highlights on individual task detail/camera pages
        if (href === '/volunteer/tasks') return pathname === href || pathname.startsWith('/volunteer/task/');
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <div className="relative min-h-screen">
                {children}

                {!hideNav ? <FieldAssistantChat bottomOffset="5.25rem" /> : null}

                {!hideNav && (
                    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-stretch z-[999] shadow-[0_-2px_24px_rgba(0,0,0,0.07)]">
                        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                            const active = isActive(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex flex-col items-center justify-center flex-1 pt-1 pb-1.5 transition-colors gap-0.5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
                                >
                                    <div className="relative flex flex-col items-center">
                                        {active && (
                                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-500" />
                                        )}
                                        <Icon className={`w-[22px] h-[22px] ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                                    </div>
                                    <span className={`text-[9px] font-bold tracking-wide ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>
        </ProtectedRoute>
    );
}
