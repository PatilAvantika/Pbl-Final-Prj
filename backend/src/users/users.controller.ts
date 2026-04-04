import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuditAction, Prisma, Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsBooleanString, IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditService } from '../audit/audit.service';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    passwordHash: string;

    @IsEnum(Role)
    role: Role;

    @IsString()
    @MinLength(2)
    firstName: string;

    @IsString()
    @MinLength(2)
    lastName: string;

    @IsOptional()
    isActive?: boolean;
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    passwordHash?: string;

    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}

export class UsersQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsBooleanString()
    isActive?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly auditService: AuditService,
    ) { }

    @Post()
    async create(@Body() data: CreateUserDto, @Request() req: any) {
        const user = await this.usersService.create(data as unknown as Prisma.UserCreateInput);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.USER_CREATED,
            entityType: 'User',
            entityId: user.id,
            metadata: { email: user.email, role: user.role },
        });
        return user;
    }

    @Get()
    findAll(@Query() query: UsersQueryDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateUserDto, @Request() req: any) {
        const user = await this.usersService.update(id, data as unknown as Prisma.UserUpdateInput);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.USER_UPDATED,
            entityType: 'User',
            entityId: id,
            metadata: { changedFields: Object.keys(data || {}) },
        });
        return user;
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        const user = await this.usersService.remove(id);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.USER_DELETED,
            entityType: 'User',
            entityId: id,
            metadata: { email: user.email },
        });
        return user;
    }
}
