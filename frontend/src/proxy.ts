import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // We check for 'token' in localStorage typically from the client,
    // but Next.js middleware runs on the server edge. It cannot access localStorage.
    // We need to check if the client sent a cookie.

    // Since we implemented localStorage entirely, a true Edge middleware is hard to enforce
    // reliably for 'localStorage' JWTs without duplicating token to cookies on Login.
    // So, let's implement the logic assuming the frontend will be updated later to set a 'session' cookie,
    // OR we just provide a basic layer for demonstration and rely on ProtectedRoute for hard enforcement.
    // 
    // Let's create a cookie check. If implemented, it blocks.

    const token = request.cookies.get('token')?.value;

    // Protect Admin Routes
    if (pathname.startsWith('/admin')) {
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirect', pathname);
            // Next.js convention: If we don't have a token cookie yet (because we use localstorage),
            // we might accidentally block legit users. 
            // For a robust JWT + Next.js build, we absolutely must move JWT to Cookies.
            // Doing so right now is the best practice. Let's redirect if no token.
            return NextResponse.redirect(url);
        }
    }

    // Protect Volunteer Routes
    if (pathname.startsWith('/volunteer')) {
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    // Protect Root Route - send to login by default
    if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
