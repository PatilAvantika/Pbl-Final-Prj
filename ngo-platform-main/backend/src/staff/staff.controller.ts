import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/**
 * Staff-scoped API surface (limited vs /admin/* controllers).
 * Expand with read-only operational endpoints as needed.
 */
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.STAFF)
@Controller('staff')
export class StaffController {
    @Get('summary')
    summary() {
        return {
            scope: 'staff',
            message: 'Staff API — use dedicated endpoints here instead of full admin routes.',
        };
    }
}
