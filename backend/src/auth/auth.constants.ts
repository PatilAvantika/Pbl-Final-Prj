import { Role } from '@prisma/client';

/** Fail-fast JWT config. Used by AuthModule, JwtStrategy, and cookie maxAge. */
export function getJwtSecret(): string {
    const s = process.env.JWT_SECRET?.trim();
    if (!s) {
        throw new Error('JWT_SECRET environment variable is required and must be non-empty');
    }
    return s;
}

/** Short-lived access JWT + cookie (seconds). Default 15 minutes. */
export function getAccessTokenTtlSec(): number {
    const raw = process.env.JWT_ACCESS_EXPIRES_SEC?.trim() || process.env.JWT_EXPIRES_SEC?.trim();
    if (!raw) return 900;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error('JWT_ACCESS_EXPIRES_SEC (or JWT_EXPIRES_SEC) must be a positive integer (seconds)');
    }
    return n;
}

/** Refresh token cookie lifetime (seconds). Default 7 days. */
export function getRefreshTokenTtlSec(): number {
    const raw = process.env.JWT_REFRESH_EXPIRES_SEC?.trim();
    if (!raw) return 60 * 60 * 24 * 7;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error('JWT_REFRESH_EXPIRES_SEC must be a positive integer (seconds)');
    }
    return n;
}

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
/** @deprecated cleared on login/logout for migration */
export const LEGACY_TOKEN_COOKIE = 'token';

export function getCookieSecure(): boolean {
    if (process.env.COOKIE_SECURE === 'true') return true;
    if (process.env.COOKIE_SECURE === 'false') return false;
    return process.env.NODE_ENV === 'production';
}

export function getCookieSameSite(): 'lax' | 'strict' | 'none' {
    const v = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
    if (v === 'strict' || v === 'none' || v === 'lax') return v;
    return 'lax';
}

function rolePasswordEnvKey(role: Role): string {
    return `ROLE_PASSWORD_${role}`;
}

/**
 * Optional shared login password per role.
 * - In production: only values provided via env vars are accepted.
 * - In non-production: fallback defaults are enabled to simplify local/demo login.
 */
export function getRoleLoginPassword(role: Role): string | null {
    const envPassword = process.env[rolePasswordEnvKey(role)]?.trim();
    if (envPassword) {
        return envPassword;
    }

    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    const defaults: Partial<Record<Role, string>> = {
        [Role.SUPER_ADMIN]: 'SuperAdmin@1234',
        [Role.NGO_ADMIN]: 'Admin@1234',
        [Role.HR_MANAGER]: 'HR@1234',
        [Role.FINANCE_MANAGER]: 'Finance@1234',
        [Role.FIELD_COORDINATOR]: 'Coordinator@1234',
        [Role.TEAM_LEADER]: 'TeamLeader@1234',
        [Role.VOLUNTEER]: 'Volunteer@1234',
        [Role.STAFF]: 'Staff@1234',
        [Role.DONOR]: 'Donor@1234',
    };

    return defaults[role] ?? null;
}
