"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const tasks_module_1 = require("./tasks/tasks.module");
const attendance_module_1 = require("./attendance/attendance.module");
const reports_module_1 = require("./reports/reports.module");
const hr_module_1 = require("./hr/hr.module");
const audit_module_1 = require("./audit/audit.module");
const onboarding_module_1 = require("./onboarding/onboarding.module");
const team_module_1 = require("./team/team.module");
const staff_module_1 = require("./staff/staff.module");
const donor_module_1 = require("./donor/donor.module");
const resources_module_1 = require("./resources/resources.module");
const redis_module_1 = require("./redis/redis.module");
const queue_module_1 = require("./queue/queue.module");
const team_leader_module_1 = require("./team-leader/team-leader.module");
const admin_dashboard_service_1 = require("./admin/admin-dashboard.service");
const admin_map_data_service_1 = require("./admin/admin-map-data.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 120,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            redis_module_1.RedisModule,
            queue_module_1.QueueModule,
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            tasks_module_1.TasksModule,
            attendance_module_1.AttendanceModule,
            reports_module_1.ReportsModule,
            hr_module_1.HrModule,
            audit_module_1.AuditModule,
            onboarding_module_1.OnboardingModule,
            team_module_1.TeamModule,
            staff_module_1.StaffModule,
            donor_module_1.DonorModule,
            resources_module_1.ResourcesModule,
            team_leader_module_1.TeamLeaderModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, admin_dashboard_service_1.AdminDashboardService, admin_map_data_service_1.AdminMapDataService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map