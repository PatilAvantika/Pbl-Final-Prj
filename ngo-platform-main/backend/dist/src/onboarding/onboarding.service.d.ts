import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser } from '../users/users.service';
import { AttendanceIntroDto, FaceSamplesDto, OnboardingProfileDto } from './dto/onboarding.dto';
export declare class OnboardingService {
    private prisma;
    constructor(prisma: PrismaService);
    private assertVolunteerOrStaff;
    saveProfile(userId: string, role: Role, dto: OnboardingProfileDto): Promise<PublicUser>;
    saveFaceSamples(userId: string, role: Role, dto: FaceSamplesDto): Promise<PublicUser>;
    completeAttendanceIntro(userId: string, role: Role, _dto: AttendanceIntroDto): Promise<PublicUser>;
}
