import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AlertsController } from './alerts.controller';

@Module({
  imports: [AnalyticsModule],
  controllers: [AlertsController],
})
export class AlertsModule {}
