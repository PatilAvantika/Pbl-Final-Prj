import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { UsersQueryDto } from './users.controller';
type SafeUser = Omit<User, 'passwordHash'>;
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.UserCreateInput): Promise<User>;
    findAll(query?: UsersQueryDto): Promise<SafeUser[]>;
    findOne(id: string): Promise<SafeUser>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<SafeUser>;
    remove(id: string): Promise<SafeUser>;
}
export {};
