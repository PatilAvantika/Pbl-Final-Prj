import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/** Pass at least one role, or omit @Roles entirely. Empty @Roles() is treated as no restriction. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
