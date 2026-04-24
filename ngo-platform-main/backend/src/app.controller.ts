import { Controller, ForbiddenException, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Role, SyncStatus } from '@prisma/client';
import { AdminDashboardService } from './admin/admin-dashboard.service';
import { AdminMapDataService } from './admin/admin-map-data.service';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
  const id = req.user?.organizationId;
  if (!id) throw new ForbiddenException('User is not associated with an organization');
  return id;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly adminDashboard: AdminDashboardService,
    private readonly adminMapData: AdminMapDataService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async getReady() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
  @Get('admin/dashboard')
  async getAdminDashboard(@Request() req: { user?: { organizationId?: string } }) {
    const organizationId = requireOrganizationId(req);
    return this.adminDashboard.getDashboardKpis(organizationId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
  @Get('admin/map-data')
  async getAdminMapData(@Request() req: { user?: { organizationId?: string } }) {
    const organizationId = requireOrganizationId(req);
    return this.adminMapData.getMapData(organizationId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
  @Get('admin/metrics')
  async getAdminMetrics(@Query('from') from?: string, @Query('to') to?: string) {
    const start = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = to ? new Date(to) : new Date();
    const now = new Date();

    const [
      activeTasks,
      volunteersOnField,
      reportsPending,
      reportsInRange,
      leavePending,
      payslipsInRange,
      syncFailures,
      recentAudit,
    ] = await Promise.all([
      this.prisma.task.count({ where: { startTime: { lte: now }, endTime: { gte: now }, isActive: true } }),
      this.prisma.attendance.groupBy({
        by: ['userId'],
        where: { type: 'CLOCK_IN', timestamp: { gte: start, lte: end } },
      }),
      this.prisma.fieldReport.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.fieldReport.count({ where: { timestamp: { gte: start, lte: end } } }),
      this.prisma.leave.count({ where: { status: 'PENDING' } }),
      this.prisma.payslip.count({
        where: {
          OR: [
            { year: { gt: start.getFullYear(), lt: end.getFullYear() } },
            { year: start.getFullYear(), month: { gte: start.getMonth() + 1 } },
            { year: end.getFullYear(), month: { lte: end.getMonth() + 1 } },
          ],
        },
      }),
      this.prisma.attendance.count({ where: { syncStatus: { in: [SyncStatus.FAILED, SyncStatus.PENDING_SYNC] } } }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    return {
      range: { from: start.toISOString(), to: end.toISOString() },
      kpis: {
        activeTasks,
        volunteersOnField: volunteersOnField.length,
        reportsPending,
        reportsInRange,
        leavePending,
        payslipsInRange,
        syncFailures,
      },
      recentActivity: recentAudit.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        createdAt: log.createdAt,
        actorName: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System',
      })),
    };
  }
}
