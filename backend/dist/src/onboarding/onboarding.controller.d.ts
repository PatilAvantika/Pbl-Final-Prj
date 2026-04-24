import { Role } from '@prisma/client';
import { FaceSamplesDto, OnboardingProfileDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';
export declare class OnboardingController {
    private readonly onboarding;
    constructor(onboarding: OnboardingService);
    putProfile(req: {
        user: {
            id: string;
            role: Role;
        };
    }, dto: OnboardingProfileDto): Promise<import("../users/users.service").PublicUser>;
    putFaceSamples(req: {
        user: {
            id: string;
            role: Role;
        };
    }, dto: FaceSamplesDto): Promise<import("../users/users.service").PublicUser>;
}
