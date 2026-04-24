'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { DashboardShell } from '../../components/DashboardShell';
import { Home, Users, Map, FileText, Settings, Briefcase, ShieldCheck } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const navItems = [
        { label: 'Dashboard', icon: Home, href: '/admin/dashboard' },
        { label: 'Tasks & Geofences', icon: Map, href: '/admin/tasks' },
        { label: 'Users', icon: Users, href: '/admin/users' },
        { label: 'HR & Payroll', icon: Users, href: '/admin/hr' },
        { label: 'Field Reports', icon: FileText, href: '/admin/reports' },
        { label: 'Audit', icon: ShieldCheck, href: '/admin/audit' },
        { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ];

    return (
        <ProtectedRoute
            allowedRoles={['SUPER_ADMIN', 'NGO_ADMIN', 'FIELD_COORDINATOR', 'HR_MANAGER', 'FINANCE_MANAGER']}
        >
            <DashboardShell
                brandTitle="FieldOps"
                brandSubtitle="Admin Portal"
                brandIcon={Briefcase}
                headerTitle="Command Center"
                navItems={navItems}
            >
                {children}
            </DashboardShell>
        </ProtectedRoute>
    );
}
