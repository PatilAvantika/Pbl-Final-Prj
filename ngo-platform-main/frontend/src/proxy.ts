import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge gate: uses httpOnly `token` from the API (see backend auth controller).
 * Client-only auth state in localStorage is enforced by ProtectedRoute.
 */
export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    if (pathname.startsWith('/admin')) {
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }

    if (pathname.startsWith('/volunteer')) {
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirect', pathname);
            url.searchParams.set('role', 'volunteer');
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
