'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const PUBLIC_PREFIXES = ['/', '/login', '/register', '/forgot', '/unauthorized'];

function isPublicPath(pathname: string): boolean {
    if (pathname === '/') return true;
    return PUBLIC_PREFIXES.some((p) => p !== '/' && pathname.startsWith(p));
}

/**
 * Full-screen loader while the httpOnly cookie session is resolved on protected areas.
 */
export function AuthSessionGate({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuth();
    const pathname = usePathname();

    if (isLoading && !isPublicPath(pathname)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                <p className="text-slate-600 font-semibold">Loading your session…</p>
            </div>
        );
    }

    return <>{children}</>;
}
