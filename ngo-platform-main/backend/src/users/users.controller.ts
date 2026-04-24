import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuditAction, Prisma, Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsBooleanString, IsEmail, IsEnum, IsInt, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';
import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_REGEX,
    PASSWORD_RULE_MESSAGE,
} from '../auth/password.validation';
import { Type } from 'class-transformer';
import { AuditService } from '../audit/audit.service';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @Matches(PASSWORD_REGEX, { message: PASSWORD_RULE_MESSAGE })
    password: string;

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
    @MinLength(PASSWORD_MIN_LENGTH)
    @Matches(PASSWORD_REGEX, { message: PASSWORD_RULE_MESSAGE })
    password?: string;

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
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly auditService: AuditService,
    ) { }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER)
    @Post()
    async create(@Body() data: CreateUserDto, @Request() req: any) {
        const user = await this.usersService.create({
            email: data.email,
            passwordHash: data.password,
            role: data.role,
            firstName: data.firstName,
            lastName: data.lastName,
            isActive: data.isActive,
        });
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.USER_CREATED,
            entityType: 'User',
            entityId: user.id,
            metadata: { email: user.email, role: user.role },
        });
        return user;
    }

    @Roles(
        Role.SUPER_ADMIN,
        Role.NGO_ADMIN,
        Role.HR_MANAGER,
        Role.FIELD_COORDINATOR,
        Role.TEAM_LEADER,
    )
    @Get()
    findAll(@Query() query: UsersQueryDto) {
        return this.usersService.findAll(query);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER)
    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateUserDto, @Request() req: any) {
        const { password, ...rest } = data;
        const prismaData: Prisma.UserUpdateInput = { ...rest };
        if (password !== undefined) {
            prismaData.passwordHash = password;
        }
        const user = await this.usersService.update(id, prismaData);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.USER_UPDATED,
            entityType: 'User',
            entityId: id,
            metadata: { changedFields: Object.keys(data || {}) },
        });
        return user;
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER)
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
