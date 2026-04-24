import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourcesRepository } from './resources.repository';

@Module({
    imports: [PrismaModule],
    controllers: [ResourcesController],
    providers: [ResourcesService, ResourcesRepository],
    exports: [ResourcesService],
})
export class ResourcesModule {}
