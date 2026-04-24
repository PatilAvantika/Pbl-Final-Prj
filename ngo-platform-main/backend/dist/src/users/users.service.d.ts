import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { UsersQueryDto } from './users.controller';
export type PublicUser = Omit<User, 'passwordHash' | 'faceEnrollmentSamples'> & {
    faceEnrollmentSampleCount: number;
};
export declare function toPublicUser(user: User): PublicUser;
type SafeUser = PublicUser;
export declare class UsersService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private resolveDefaultOrganizationId;
    create(data: Omit<Prisma.UserCreateInput, 'organization'> & {
        organization?: Prisma.UserCreateInput['organization'];
    }): Promise<PublicUser>;
    findAll(query?: UsersQueryDto): Promise<SafeUser[]>;
    findOne(id: string): Promise<SafeUser>;
    findSafeUserByIdOrNull(id: string): Promise<SafeUser | null>;
    findByEmail(email: string): Promise<User | null>;
    findAuthPrincipalById(id: string): Promise<Pick<User, 'id' | 'email' | 'role' | 'isActive' | 'authInvalidatedAt' | 'organizationId'> | null>;
    markAuthInvalidatedNow(userId: string): Promise<void>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<SafeUser>;
    remove(id: string): Promise<SafeUser>;
}
export {};
