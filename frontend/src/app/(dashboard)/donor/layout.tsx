'use client';

import { type ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DonorShell } from '@/features/donor/components/DonorShell';

export default function DonorLayout({ children }: { children: ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['DONOR']}>
            <DonorShell>{children}</DonorShell>
        </ProtectedRoute>
    );
}
