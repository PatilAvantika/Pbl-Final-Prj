"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_TOKEN_COOKIE = exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = void 0;
exports.getJwtSecret = getJwtSecret;
exports.getAccessTokenTtlSec = getAccessTokenTtlSec;
exports.getRefreshTokenTtlSec = getRefreshTokenTtlSec;
exports.getCookieSecure = getCookieSecure;
exports.getCookieSameSite = getCookieSameSite;
function getJwtSecret() {
    const s = process.env.JWT_SECRET?.trim();
    if (!s) {
        throw new Error('JWT_SECRET environment variable is required and must be non-empty');
    }
    return s;
}
function getAccessTokenTtlSec() {
    const raw = process.env.JWT_ACCESS_EXPIRES_SEC?.trim() || process.env.JWT_EXPIRES_SEC?.trim();
    if (!raw)
        return 900;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error('JWT_ACCESS_EXPIRES_SEC (or JWT_EXPIRES_SEC) must be a positive integer (seconds)');
    }
    return n;
}
function getRefreshTokenTtlSec() {
    const raw = process.env.JWT_REFRESH_EXPIRES_SEC?.trim();
    if (!raw)
        return 60 * 60 * 24 * 7;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error('JWT_REFRESH_EXPIRES_SEC must be a positive integer (seconds)');
    }
    return n;
}
exports.ACCESS_TOKEN_COOKIE = 'access_token';
exports.REFRESH_TOKEN_COOKIE = 'refresh_token';
exports.LEGACY_TOKEN_COOKIE = 'token';
function getCookieSecure() {
    if (process.env.COOKIE_SECURE === 'true')
        return true;
    if (process.env.COOKIE_SECURE === 'false')
        return false;
    return process.env.NODE_ENV === 'production';
}
function getCookieSameSite() {
    const v = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
    if (v === 'strict' || v === 'none' || v === 'lax')
        return v;
    return 'lax';
}
//# sourceMappingURL=auth.constants.js.map