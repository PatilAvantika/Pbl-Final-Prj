import type { Role } from '@/types/role';

const ADMIN_LIKE_ROLES: Role[] = [
    'SUPER_ADMIN',
    'NGO_ADMIN',
    'FIELD_COORDINATOR',
    'HR_MANAGER',
    'FINANCE_MANAGER',
];

/** Default app home for a role (post-login / unauthorized redirect). */
export function getDefaultRouteForRole(role: Role | string | null | undefined): string {
    if (!role) {
        if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('[auth] getDefaultRouteForRole: missing role, sending to /login');
        }
        return '/login';
    }

    const r = role as Role;

    if (r === 'TEAM_LEADER') return '/team-leader/dashboard';
    if (r === 'VOLUNTEER') return '/volunteer/dashboard';
    if (r === 'STAFF') return '/staff/dashboard';
    if (r === 'DONOR') return '/donor';

    if (ADMIN_LIKE_ROLES.includes(r)) return '/admin/dashboard';

    if (typeof console !== 'undefined') {
        console.warn('[auth] Unknown role for routing, using fallback:', r);
    }
    return '/unauthorized';
}

export function isAdminLikeRole(role: Role | string | undefined): boolean {
    if (!role) return false;
    return ADMIN_LIKE_ROLES.includes(role as Role);
}

export function isTeamLeaderRole(role: Role | string | undefined): boolean {
    return role === 'TEAM_LEADER';
}

export function isVolunteerRole(role: Role | string | undefined): boolean {
    return role === 'VOLUNTEER';
}

export function isStaffRole(role: Role | string | undefined): boolean {
    return role === 'STAFF';
}

export function isDonorRole(role: Role | string | undefined): boolean {
    return role === 'DONOR';
}
