'use client';

import { type ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import {
    LayoutDashboard,
    HeartHandshake,
    FileText,
    BarChart3,
    User,
    Megaphone,
} from 'lucide-react';

const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/donor' },
    { label: 'Campaigns', icon: Megaphone, href: '/donor/campaigns' },
    { label: 'Reports', icon: FileText, href: '/donor/reports' },
    { label: 'Analytics', icon: BarChart3, href: '/donor/analytics' },
    { label: 'Profile', icon: User, href: '/donor/profile' },
];

const HEADER_BY_PATH: Record<string, string> = {
    '/donor': 'Impact overview',
    '/donor/campaigns': 'Campaigns you fund',
    '/donor/reports': 'Verified field reports',
    '/donor/analytics': 'Analytics & insights',
    '/donor/profile': 'Your profile',
};

export function DonorShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const normalized = pathname.replace(/\/$/, '') || '/donor';
    const headerTitle = useMemo(() => HEADER_BY_PATH[normalized] ?? 'Donor portal', [normalized]);

    return (
        <DashboardShell
            brandTitle="FieldOps"
            brandSubtitle="Donor Portal"
            brandIcon={HeartHandshake}
            accent="amber"
            headerTitle={headerTitle}
            navItems={navItems}
            navHomeHref="/donor"
        >
            {children}
        </DashboardShell>
    );
}
