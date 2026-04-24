import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, toPublicUser } from '../users/users.service';
import { FaceSamplesDto, OnboardingProfileDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  private assertVolunteerOrStaff(role: Role) {
    if (role !== Role.VOLUNTEER && role !== Role.STAFF) {
      throw new ForbiddenException('Onboarding is only for volunteer or staff accounts');
    }
  }

  async saveProfile(userId: string, role: Role, dto: OnboardingProfileDto): Promise<PublicUser> {
    this.assertVolunteerOrStaff(role);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        department: dto.department,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        onboardingProfileComplete: true,
      },
    });
    return toPublicUser(updated);
  }

  async saveFaceSamples(userId: string, role: Role, dto: FaceSamplesDto): Promise<PublicUser> {
    this.assertVolunteerOrStaff(role);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.onboardingProfileComplete) {
      throw new ForbiddenException('Complete your profile before face registration');
    }
    const required: FaceSamplesDto['samples'][number]['angle'][] = ['front', 'left', 'right'];
    for (const angle of required) {
      if (!dto.samples.some((s) => s.angle === angle)) {
        throw new BadRequestException(`Missing ${angle} face capture`);
      }
    }
    const jsonSamples: Prisma.InputJsonValue = dto.samples.map((s) => ({
      angle: s.angle,
      dataUrl: s.dataUrl,
    }));

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        faceEnrollmentSamples: jsonSamples,
        onboardingFaceComplete: true,
      },
    });
    return toPublicUser(updated);
  }

}
