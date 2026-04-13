import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersQueryDto } from './users.controller';

/** API-safe user: no password hash, no raw face blobs (only a count). */
export type PublicUser = Omit<User, 'passwordHash' | 'faceEnrollmentSamples'> & {
  faceEnrollmentSampleCount: number;
};

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, faceEnrollmentSamples, ...rest } = user;
  const samples = faceEnrollmentSamples;
  const faceEnrollmentSampleCount = Array.isArray(samples) ? samples.length : 0;
  return { ...rest, faceEnrollmentSampleCount };
}

type SafeUser = PublicUser;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Ensures at least one tenant org exists so self-service signup (donor, volunteer, etc.)
   * never hits a foreign-key error when Organization was never seeded.
   */
  private async resolveDefaultOrganizationId(): Promise<string> {
    const org = await this.prisma.organization.upsert({
      where: { slug: 'default' },
      update: {},
      create: {
        name: 'Default Organization',
        slug: 'default',
      },
    });
    return org.id;
  }

  async create(
    data: Omit<Prisma.UserCreateInput, 'organization'> & {
      organization?: Prisma.UserCreateInput['organization'];
    },
  ): Promise<PublicUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('User with that email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash as string, salt);

    const role = data.role as Role;
    const onboarding =
      role === Role.VOLUNTEER || role === Role.STAFF
        ? {
            onboardingProfileComplete: false,
            onboardingFaceComplete: false,
            onboardingAttendanceIntroComplete: false,
          }
        : {
            onboardingProfileComplete: true,
            onboardingFaceComplete: true,
            onboardingAttendanceIntroComplete: true,
          };

    const { organization: orgInput, passwordHash: _plain, ...rest } = data;
    const defaultOrgId = await this.resolveDefaultOrganizationId();

    this.logger.log(
      `user.create attempt email=${data.email} role=${String(data.role)} orgConnect=${orgInput ? 'explicit' : `default:${defaultOrgId}`}`,
    );

    try {
      const created = await this.prisma.user.create({
        data: {
          ...onboarding,
          ...rest,
          passwordHash,
          organization: orgInput ?? { connect: { id: defaultOrgId } },
        },
      });
      return toPublicUser(created);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `Prisma user.create failed code=${err.code} meta=${JSON.stringify(err.meta)} message=${err.message}`,
          err.stack,
        );
        if (err.code === 'P2002') {
          const target = err.meta?.target as string[] | string | undefined;
          const fields = Array.isArray(target) ? target : target ? [target] : [];
          const isEmail = fields.some((f) =>
            String(f).toLowerCase().includes('email'),
          );
          throw new ConflictException(
            isEmail
              ? 'An account with this email already exists.'
              : 'This value already exists. Please use a different one.',
          );
        }
      }
      throw err;
    }
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

    return users.map((u) => toPublicUser(u));
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }

  /** No throw — for /auth/me so missing user returns 401, not 404. */
  async findSafeUserByIdOrNull(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      return null;
    }
    return toPublicUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** For JWT validation: no throw; use for auth guard only. */
  async findAuthPrincipalById(
    id: string,
  ): Promise<
    Pick<User, 'id' | 'email' | 'role' | 'isActive' | 'authInvalidatedAt' | 'organizationId'> | null
  > {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        authInvalidatedAt: true,
        organizationId: true,
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
    return toPublicUser(updatedUser);
  }

  async remove(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const deletedUser = await this.prisma.user.delete({ where: { id } });
    return toPublicUser(deletedUser);
  }
}
