import type { Role } from '../types/role';

export const PermissionMatrix = {
    manageUsers: ['SUPER_ADMIN', 'NGO_ADMIN', 'HR_MANAGER'],
    createOrEditTasks: ['SUPER_ADMIN', 'NGO_ADMIN', 'FIELD_COORDINATOR'],
    reviewReports: ['SUPER_ADMIN', 'NGO_ADMIN', 'FIELD_COORDINATOR'],
    managePayroll: ['SUPER_ADMIN', 'NGO_ADMIN', 'HR_MANAGER'],
    viewAudit: ['SUPER_ADMIN', 'NGO_ADMIN', 'HR_MANAGER', 'FIELD_COORDINATOR'],
} as const;

export function hasPermission(role: Role | undefined, permission: keyof typeof PermissionMatrix) {
    if (!role) return false;
    return (PermissionMatrix[permission] as readonly Role[]).includes(role);
}
