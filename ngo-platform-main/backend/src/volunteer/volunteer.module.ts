import { Module } from '@nestjs/common';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VolunteerController],
  providers: [VolunteerService],
})
export class VolunteerModule {}
