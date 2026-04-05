'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Role } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not authenticated
                router.push('/login');
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                // Authenticated but does not have the required role
                router.push('/unauthorized'); // or redirect to their specific dashboard
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Verifying credentials...</p>
            </div>
        );
    }

    // Only render children if user exists AND (if roles are specified) user role is allowed 
    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}
