import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveType, TaskLifecycleStatus } from '@prisma/client';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';

export type VolunteerDashboardDto = {
  totalHours: number;
  activeDays: number;
  tasksCompleted: number;
  streakDays: number;
};

@Injectable()
export class VolunteerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionIntelligence: DecisionIntelligenceService,
  ) {}

  /** Calendar day key in the server local timezone (matches legacy dashboard logic). */
  private toLocalDateKey(d: Date): string {
    return d.toDateString();
  }

  private monthBounds(now: Date): { start: Date; end: Date } {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  async getDashboardStats(userId: string, organizationId: string): Promise<VolunteerDashboardDto> {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = this.monthBounds(now);

    const [monthRows, allClockIns, completedAssignments] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          userId,
          timestamp: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.attendance.findMany({
        where: { userId, type: 'CLOCK_IN' },
        select: { timestamp: true },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.taskAssignment.count({
        where: {
          userId,
          task: {
            organizationId,
            lifecycleStatus: TaskLifecycleStatus.COMPLETED,
          },
        },
      }),
    ]);

    const clockInsMonth = monthRows.filter((h) => h.type === 'CLOCK_IN');
    const clockOutsMonth = monthRows.filter((h) => h.type === 'CLOCK_OUT');

    let totalMs = 0;
    for (const out of clockOutsMonth) {
      const outTime = out.timestamp;
      const dayKey = this.toLocalDateKey(outTime);
      const matchIn = clockInsMonth.find(
        (ci) =>
          ci.taskId === out.taskId && this.toLocalDateKey(ci.timestamp) === dayKey,
      );
      if (matchIn) {
        totalMs += outTime.getTime() - matchIn.timestamp.getTime();
      }
    }
    const totalHours = Math.floor(totalMs / 3_600_000);

    const activeDays = new Set(clockInsMonth.map((h) => this.toLocalDateKey(h.timestamp))).size;

    const allDates = new Set(allClockIns.map((h) => this.toLocalDateKey(h.timestamp)));
    let streakDays = 0;
    for (let i = 0; i <= 60; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      if (allDates.has(d.toDateString())) {
        streakDays++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }

    return {
      totalHours,
      activeDays,
      tasksCompleted: completedAssignments,
      streakDays,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        timezone: true,
        organizationId: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { organizationId, ...rest } = user;
    const rel = await this.decisionIntelligence.computeReliability(userId, organizationId);
    return {
      ...rest,
      reliability_score: rel.reliability_score,
      reliability_category: rel.category,
      reliability_badge: rel.badge,
    };
  }

  async getLeaveSummary(userId: string) {
    const [pending, approved, rejected, total] = await Promise.all([
      this.prisma.leave.count({ where: { userId, status: 'PENDING' } }),
      this.prisma.leave.count({ where: { userId, status: 'APPROVED' } }),
      this.prisma.leave.count({ where: { userId, status: 'REJECTED' } }),
      this.prisma.leave.count({ where: { userId } }),
    ]);
    return { pending, approved, rejected, total };
  }

  async getLeaves(userId: string) {
    return this.prisma.leave.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createLeave(
    userId: string,
    data: { type: LeaveType; startDate: Date; endDate: Date; reason: string },
  ) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('End date must be on or after start date');
    }
    const trimmed = data.reason?.trim();
    if (!trimmed) throw new BadRequestException('Reason is required');
    return this.prisma.leave.create({
      data: {
        type: data.type,
        startDate: start,
        endDate: end,
        reason: trimmed,
        user: { connect: { id: userId } },
      },
    });
  }

  async cancelLeave(leaveId: string, userId: string): Promise<void> {
    const leave = await this.prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.userId !== userId) throw new ForbiddenException('Not your leave request');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }
    await this.prisma.leave.delete({ where: { id: leaveId } });
  }
}
