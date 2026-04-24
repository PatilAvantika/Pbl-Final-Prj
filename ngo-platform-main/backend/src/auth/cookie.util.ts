import type { Response } from 'express';
import {
    ACCESS_TOKEN_COOKIE,
    getAccessTokenTtlSec,
    getCookieSameSite,
    getCookieSecure,
    getRefreshTokenTtlSec,
    LEGACY_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
} from './auth.constants';

const baseOpts = () => ({
    httpOnly: true as const,
    secure: getCookieSecure(),
    sameSite: getCookieSameSite(),
    path: '/',
});

export function setAccessTokenCookie(res: Response, accessToken: string): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
        ...baseOpts(),
        maxAge: getAccessTokenTtlSec() * 1000,
    });
}

export function setRefreshTokenCookie(res: Response, refreshToken: string, maxAgeSec: number): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
        ...baseOpts(),
        maxAge: maxAgeSec * 1000,
    });
}

export function clearAuthCookies(res: Response): void {
    const opts = { path: '/', httpOnly: true as const, secure: getCookieSecure(), sameSite: getCookieSameSite() };
    res.clearCookie(ACCESS_TOKEN_COOKIE, opts);
    res.clearCookie(REFRESH_TOKEN_COOKIE, opts);
    res.clearCookie(LEGACY_TOKEN_COOKIE, opts);
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
