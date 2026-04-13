import { Module } from '@nestjs/common';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';
import { DonorRepository } from './donor.repository';
import { DonorCacheService } from './donor-cache.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuditModule],
    controllers: [DonorController],
    providers: [DonorRepository, DonorCacheService, DonorService],
    exports: [DonorService, DonorRepository, DonorCacheService],
})
export class DonorModule {}
