import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersQueryDto } from './users.controller';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('User with that email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash,
      },
    });
  }

  async findAll(query?: UsersQueryDto): Promise<SafeUser[]> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where: {
        role: query?.role,
        isActive: query?.isActive !== undefined ? query.isActive === 'true' : undefined,
        OR: query?.search
          ? [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /** No throw — for /auth/me so missing user returns 401, not 404. */
  async findSafeUserByIdOrNull(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      return null;
    }
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** For JWT validation: no throw; use for auth guard only. */
  async findAuthPrincipalById(
    id: string,
  ): Promise<
    Pick<User, 'id' | 'email' | 'role' | 'isActive' | 'authInvalidatedAt'> | null
  > {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        authInvalidatedAt: true,
      },
    });
  }

  async markAuthInvalidatedNow(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { authInvalidatedAt: new Date() },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (data.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(data.passwordHash as string, salt);
    }
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });
    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  async remove(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const deletedUser = await this.prisma.user.delete({ where: { id } });
    const { passwordHash, ...safeUser } = deletedUser;
    return safeUser;
  }
}
