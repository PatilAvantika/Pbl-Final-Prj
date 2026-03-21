import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma, Role } from '@prisma/client';

export class CreateUserDto {
    email: string;
    passwordHash: string;
    role: Role;
    firstName: string;
    lastName: string;
}

export class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
    isActive?: boolean;
}

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    create(@Body() data: CreateUserDto) {
        return this.usersService.create(data as unknown as Prisma.UserCreateInput);
    }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: UpdateUserDto) {
        return this.usersService.update(id, data as unknown as Prisma.UserUpdateInput);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
