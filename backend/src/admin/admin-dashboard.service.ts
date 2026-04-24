import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncStatus, TaskLifecycleStatus } from '@prisma/client';

type AttRow = {
  userId: string;
  taskId: string | null;
  type: string;
  timestamp: Date;
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * User is "on field" today if replay of attendance leaves an open CLOCK_IN whose
   * opening CLOCK_IN timestamp falls on the current UTC calendar day.
   */
  private userHasOpenClockInToday(rows: AttRow[], dayStartUtc: Date, dayEndUtc: Date): boolean {
    let openTaskId: string | null = null;
    let openedAt: Date | null = null;
    for (const r of rows) {
      if (!r.taskId) continue;
      if (r.type === 'CLOCK_IN') {
        openTaskId = r.taskId;
        openedAt = r.timestamp;
      } else if (r.type === 'CLOCK_OUT' && openTaskId !== null && r.taskId === openTaskId) {
        openTaskId = null;
        openedAt = null;
      }
    }
    if (openTaskId === null || openedAt === null) return false;
    const t = openedAt.getTime();
    return t >= dayStartUtc.getTime() && t <= dayEndUtc.getTime();
  }

  async getDashboardKpis(organizationId: string): Promise<{
    activeTasks: number;
    volunteersOnField: number;
    reportsPending: number;
    syncFailures: number;
  }> {
    const now = new Date();
    const dayStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const dayEndUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lookback = new Date(dayStartUtc);
    lookback.setUTCDate(lookback.getUTCDate() - 1);

    const [activeTasks, reportsPending, syncFailures, orgUsers] = await Promise.all([
      this.prisma.task.count({
        where: {
          organizationId,
          isActive: true,
          lifecycleStatus: TaskLifecycleStatus.ACTIVE,
          startTime: { lte: now },
          endTime: { gte: now },
        },
      }),
      this.prisma.fieldReport.count({
        where: { organizationId, status: 'SUBMITTED' },
      }),
      this.prisma.attendance.count({
        where: {
          syncStatus: SyncStatus.FAILED,
          timestamp: { gte: since24h },
          user: { organizationId },
        },
      }),
      this.prisma.user.findMany({
        where: { organizationId, isActive: true },
        select: { id: true },
      }),
    ]);

    const userIds = orgUsers.map((u) => u.id);
    let volunteersOnField = 0;
    if (userIds.length > 0) {
      const rows = await this.prisma.attendance.findMany({
        where: { userId: { in: userIds }, timestamp: { gte: lookback } },
        orderBy: { timestamp: 'asc' },
        select: { userId: true, taskId: true, type: true, timestamp: true },
      });
      const byUser = new Map<string, AttRow[]>();
      for (const r of rows) {
        const list = byUser.get(r.userId) ?? [];
        list.push(r);
        byUser.set(r.userId, list);
      }
      for (const uid of userIds) {
        if (this.userHasOpenClockInToday(byUser.get(uid) ?? [], dayStartUtc, dayEndUtc)) {
          volunteersOnField += 1;
        }
      }
    }

    return { activeTasks, volunteersOnField, reportsPending, syncFailures };
  }
}
