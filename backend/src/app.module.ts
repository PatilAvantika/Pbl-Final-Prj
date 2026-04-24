import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { HrModule } from './hr/hr.module';
import { AuditModule } from './audit/audit.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TeamModule } from './team/team.module';
import { StaffModule } from './staff/staff.module';
import { DonorModule } from './donor/donor.module';
import { ResourcesModule } from './resources/resources.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { TeamLeaderModule } from './team-leader/team-leader.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AlertsModule } from './alerts/alerts.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AiModule } from './ai/ai.module';
import { AdminDashboardService } from './admin/admin-dashboard.service';
import { AdminMapDataService } from './admin/admin-map-data.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    ScheduleModule.forRoot(),
    RedisModule,
    QueueModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    TasksModule,
    AttendanceModule,
    ReportsModule,
    HrModule,
    AuditModule,
    OnboardingModule,
    TeamModule,
    StaffModule,
    DonorModule,
    ResourcesModule,
    TeamLeaderModule,
    AnalyticsModule,
    AlertsModule,
    ChatbotModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService, AdminDashboardService, AdminMapDataService],
})
export class AppModule { }
