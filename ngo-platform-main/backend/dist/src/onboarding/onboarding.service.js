"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let OnboardingService = class OnboardingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertVolunteerOrStaff(role) {
        if (role !== client_1.Role.VOLUNTEER && role !== client_1.Role.STAFF) {
            throw new common_1.ForbiddenException('Onboarding is only for volunteer or staff accounts');
        }
    }
    async saveProfile(userId, role, dto) {
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
        return (0, users_service_1.toPublicUser)(updated);
    }
    async saveFaceSamples(userId, role, dto) {
        this.assertVolunteerOrStaff(role);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.onboardingProfileComplete) {
            throw new common_1.ForbiddenException('Complete your profile before face registration');
        }
        const required = ['front', 'left', 'right'];
        for (const angle of required) {
            if (!dto.samples.some((s) => s.angle === angle)) {
                throw new common_1.BadRequestException(`Missing ${angle} face capture`);
            }
        }
        const jsonSamples = dto.samples.map((s) => ({
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
        return (0, users_service_1.toPublicUser)(updated);
    }
    async completeAttendanceIntro(userId, role, _dto) {
        this.assertVolunteerOrStaff(role);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.onboardingFaceComplete) {
            throw new common_1.ForbiddenException('Complete face registration before attendance verification');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { onboardingAttendanceIntroComplete: true },
        });
        return (0, users_service_1.toPublicUser)(updated);
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map