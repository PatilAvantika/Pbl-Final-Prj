"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
exports.toPublicUser = toPublicUser;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
function toPublicUser(user) {
    const { passwordHash, faceEnrollmentSamples, ...rest } = user;
    const samples = faceEnrollmentSamples;
    const faceEnrollmentSampleCount = Array.isArray(samples) ? samples.length : 0;
    return { ...rest, faceEnrollmentSampleCount };
}
let UsersService = UsersService_1 = class UsersService {
    prisma;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveDefaultOrganizationId() {
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
    async create(data) {
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existing) {
            throw new common_1.ConflictException('User with that email already exists');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.passwordHash, salt);
        const role = data.role;
        const onboarding = role === client_1.Role.VOLUNTEER || role === client_1.Role.STAFF
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
        this.logger.log(`user.create attempt email=${data.email} role=${String(data.role)} orgConnect=${orgInput ? 'explicit' : `default:${defaultOrgId}`}`);
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
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                this.logger.error(`Prisma user.create failed code=${err.code} meta=${JSON.stringify(err.meta)} message=${err.message}`, err.stack);
                if (err.code === 'P2002') {
                    const target = err.meta?.target;
                    const fields = Array.isArray(target) ? target : target ? [target] : [];
                    const isEmail = fields.some((f) => String(f).toLowerCase().includes('email'));
                    throw new common_1.ConflictException(isEmail
                        ? 'An account with this email already exists.'
                        : 'This value already exists. Please use a different one.');
                }
            }
            throw err;
        }
    }
    async findAll(query) {
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
    async findOne(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return toPublicUser(user);
    }
    async findSafeUserByIdOrNull(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return null;
        }
        return toPublicUser(user);
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findAuthPrincipalById(id) {
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
    async markAuthInvalidatedNow(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { authInvalidatedAt: new Date() },
        });
    }
    async update(id, data) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (data.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            data.passwordHash = await bcrypt.hash(data.passwordHash, salt);
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
        });
        return toPublicUser(updatedUser);
    }
    async remove(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const deletedUser = await this.prisma.user.delete({ where: { id } });
        return toPublicUser(deletedUser);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map