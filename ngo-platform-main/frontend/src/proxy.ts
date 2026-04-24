import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Next.js 16+ request proxy (replaces legacy middleware.ts).
 * Validates httpOnly `access_token` cookie and role vs route prefix.
 */
const ADMIN_ROLES = new Set([
    'SUPER_ADMIN',
    'NGO_ADMIN',
    'FIELD_COORDINATOR',
    'HR_MANAGER',
    'FINANCE_MANAGER',
]);

function homeForRole(role: string): string {
    if (role === 'TEAM_LEADER') return '/team-leader/dashboard';
    if (role === 'VOLUNTEER') return '/volunteer/dashboard';
    if (role === 'STAFF') return '/staff/dashboard';
    if (role === 'DONOR') return '/donor';
    if (ADMIN_ROLES.has(role)) return '/admin/dashboard';
    return '/login';
}

type Rule = { test: (path: string) => boolean; allow: (role: string) => boolean };

const rules: Rule[] = [
    { test: (p) => p.startsWith('/admin'), allow: (r) => ADMIN_ROLES.has(r) },
    { test: (p) => p.startsWith('/team-leader'), allow: (r) => r === 'TEAM_LEADER' },
    { test: (p) => p.startsWith('/volunteer'), allow: (r) => r === 'VOLUNTEER' },
    { test: (p) => p.startsWith('/staff'), allow: (r) => r === 'STAFF' },
    { test: (p) => p.startsWith('/donor'), allow: (r) => r === 'DONOR' },
    { test: (p) => p === '/onboarding' || p.startsWith('/onboarding/'), allow: (r) => r === 'VOLUNTEER' },
];

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const rule = rules.find((r) => r.test(pathname));
    if (!rule) {
        return NextResponse.next();
    }

    const token =
        request.cookies.get('access_token')?.value || request.cookies.get('token')?.value;
    const secret = process.env.AUTH_JWT_SECRET;
    if (!token || !secret) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        const role = typeof payload.role === 'string' ? payload.role : '';
        if (!rule.allow(role)) {
            return NextResponse.redirect(new URL(homeForRole(role), request.url));
        }
        return NextResponse.next();
    } catch {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/team-leader/:path*',
        '/volunteer/:path*',
        '/staff/:path*',
        '/donor',
        '/donor/:path*',
        '/onboarding',
        '/onboarding/:path*',
    ],
};
