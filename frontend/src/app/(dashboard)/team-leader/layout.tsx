'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DashboardShell } from '@/components/DashboardShell';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    ClipboardCheck,
    ShieldCheck,
    Package,
    UserCog,
    BarChart3,
} from 'lucide-react';

export default function TeamLeaderLayout({ children }: { children: ReactNode }) {
    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/team-leader/dashboard' },
        { label: 'Team', icon: Users, href: '/team-leader/team' },
        { label: 'Tasks', icon: ClipboardList, href: '/team-leader/tasks' },
        { label: 'Attendance', icon: ClipboardCheck, href: '/team-leader/attendance' },
        { label: 'Reports', icon: ShieldCheck, href: '/team-leader/reports' },
        { label: 'Analytics', icon: BarChart3, href: '/team-leader/analytics' },
        { label: 'Resources', icon: Package, href: '/team-leader/resources' },
    ];

    return (
        <ProtectedRoute allowedRoles={['TEAM_LEADER']}>
            <DashboardShell
                brandTitle="FieldOps"
                brandSubtitle="Team Leader"
                brandIcon={UserCog}
                headerTitle="Team leader workspace"
                navItems={navItems}
                navHomeHref="/team-leader/dashboard"
            >
                {children}
            </DashboardShell>
        </ProtectedRoute>
    );
}
