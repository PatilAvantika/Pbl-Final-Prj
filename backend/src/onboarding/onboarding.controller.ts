import { Body, Controller, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FaceSamplesDto, OnboardingProfileDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.VOLUNTEER, Role.STAFF)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Put('profile')
  putProfile(
    @Request() req: { user: { id: string; role: Role } },
    @Body() dto: OnboardingProfileDto,
  ) {
    return this.onboarding.saveProfile(req.user.id, req.user.role, dto);
  }

  @Put('face-samples')
  putFaceSamples(
    @Request() req: { user: { id: string; role: Role } },
    @Body() dto: FaceSamplesDto,
  ) {
    return this.onboarding.saveFaceSamples(req.user.id, req.user.role, dto);
  }

}
