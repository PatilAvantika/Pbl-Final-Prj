'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DashboardShell } from '@/components/DashboardShell';
import { LayoutDashboard, Briefcase } from 'lucide-react';

export default function StaffLayout({ children }: { children: ReactNode }) {
    const navItems = [{ label: 'Dashboard', icon: LayoutDashboard, href: '/staff/dashboard' }];

    return (
        <ProtectedRoute allowedRoles={['STAFF']}>
            <DashboardShell
                brandTitle="FieldOps"
                brandSubtitle="Staff Portal"
                brandIcon={Briefcase}
                headerTitle="Staff workspace"
                navItems={navItems}
            >
                {children}
            </DashboardShell>
        </ProtectedRoute>
    );
}
