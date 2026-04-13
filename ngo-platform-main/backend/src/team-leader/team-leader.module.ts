import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamLeaderController } from './team-leader.controller';
import { TeamLeaderService } from './team-leader.service';

@Module({
    imports: [PrismaModule],
    controllers: [TeamLeaderController],
    providers: [TeamLeaderService],
})
export class TeamLeaderModule {}
