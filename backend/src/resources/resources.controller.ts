import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResourcesService } from './resources.service';
import { AllocateResourceDto, CreateResourceDto } from './dto/allocate-resource.dto';

type Authed = Request & { user: { id: string; role: Role; organizationId?: string } };

function requireOrganizationId(user: Authed['user']): string {
    if (!user.organizationId) {
        throw new ForbiddenException('User is not associated with an organization');
    }
    return user.organizationId;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('resources')
export class ResourcesController {
    constructor(private readonly resourcesService: ResourcesService) {}

    @Roles(
        Role.SUPER_ADMIN,
        Role.NGO_ADMIN,
        Role.FIELD_COORDINATOR,
        Role.TEAM_LEADER,
        Role.STAFF,
        Role.VOLUNTEER,
    )
    @Get()
    list(@Request() req: Authed) {
        const organizationId = requireOrganizationId(req.user);
        return this.resourcesService.list(organizationId);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Get('allocations')
    listAllocations(@Request() req: Authed) {
        const organizationId = requireOrganizationId(req.user);
        return this.resourcesService.listAllocations(req.user.id, req.user.role, organizationId);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Post()
    create(@Body() dto: CreateResourceDto, @Request() req: Authed) {
        const organizationId = requireOrganizationId(req.user);
        return this.resourcesService.create(organizationId, dto);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Post('allocate')
    allocate(@Body() dto: AllocateResourceDto, @Request() req: Authed) {
        const organizationId = requireOrganizationId(req.user);
        return this.resourcesService.allocate(req.user.id, req.user.role, organizationId, dto);
    }
}
