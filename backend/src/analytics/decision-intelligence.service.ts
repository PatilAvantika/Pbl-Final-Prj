import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TaskLifecycleStatus, LeaveStatus, ReportStatus } from '@prisma/client';
import { getDistanceFromLatLonInMeters } from '../utils/geo.util';

/** Metrics window for reliability ratios (assignments / attendance / reports). */
const RELIABILITY_LOOKBACK_DAYS = 90;
/** Rolling window for high-risk absence prediction. */
const ABSENCE_RISK_LOOKBACK_DAYS = 7;
/** Minutes after task start with no timely clock-in → treated as absent for alerts. */
const CHECKIN_GRACE_MINUTES = 30;
/** Early clock-in allowed before task start (ms). */
const EARLY_CHECKIN_MS = 60 * 60 * 1000;

export type ReliabilityCategory = 'reliable' | 'average' | 'at_risk';

export type WorkerSuggestion = {
  worker_id: string;
  worker_name: string;
  score: number;
  reliability_score: number;
  distance_score: number;
  workload_score: number;
  badge: string;
};

function categoryFromScore(score: number): ReliabilityCategory {
  if (score > 0.75) return 'reliable';
  if (score >= 0.5) return 'average';
  return 'at_risk';
}

function safeRatio(num: number, den: number): number {
  if (den <= 0) return 1;
  return Math.min(1, Math.max(0, num / den));
}

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

@Injectable()
export class DecisionIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  private reliabilityWindowStart(): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - RELIABILITY_LOOKBACK_DAYS);
    return d;
  }

  private absenceWindowStart(): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - ABSENCE_RISK_LOOKBACK_DAYS);
    return d;
  }

  /** True if user has approved leave covering `at` instant. */
  private async hasApprovedLeaveAt(userId: string, at: Date): Promise<boolean> {
    const n = await this.prisma.leave.count({
      where: {
        userId,
        status: LeaveStatus.APPROVED,
        startDate: { lte: at },
        endDate: { gte: at },
      },
    });
    return n > 0;
  }

  /**
   * Timely clock-in: first CLOCK_IN for this user+task between (start - 1h) and (start + grace).
   */
  private async hasTimelyClockIn(userId: string, taskId: string, taskStart: Date): Promise<boolean> {
    const windowStart = new Date(taskStart.getTime() - EARLY_CHECKIN_MS);
    const deadline = new Date(taskStart.getTime() + CHECKIN_GRACE_MINUTES * 60 * 1000);
    const hit = await this.prisma.attendance.findFirst({
      where: {
        userId,
        taskId,
        type: 'CLOCK_IN',
        timestamp: { gte: windowStart, lte: deadline },
      },
      select: { id: true },
    });
    return !!hit;
  }

  async assertWorkerInOrganization(workerId: string, organizationId: string): Promise<void> {
    const u = await this.prisma.user.findFirst({
      where: { id: workerId, organizationId },
      select: { id: true },
    });
    if (!u) throw new NotFoundException('Worker not found in organization');
  }

  /**
   * reliability_score =
   *   0.5 * attendance_rate + 0.3 * task_completion_rate + 0.2 * report_approval_rate
   * attendance_rate = present_days / assigned_days (distinct task-start days in window)
   */
  async computeReliability(workerId: string, organizationId: string): Promise<{
    worker_id: string;
    reliability_score: number;
    category: ReliabilityCategory;
    attendance_rate: number;
    task_completion_rate: number;
    report_approval_rate: number;
    present_days: number;
    assigned_days: number;
    completed_tasks: number;
    assigned_tasks: number;
    approved_reports: number;
    total_reports: number;
    badge: string;
  }> {
    await this.assertWorkerInOrganization(workerId, organizationId);
    const since = this.reliabilityWindowStart();

    const assignments = await this.prisma.taskAssignment.findMany({
      where: {
        userId: workerId,
        task: { organizationId, startTime: { gte: since } },
      },
      select: { taskId: true, task: { select: { startTime: true, lifecycleStatus: true } } },
    });

    const assignedDayKeys = new Set<string>();
    let completedTasks = 0;
    for (const a of assignments) {
      assignedDayKeys.add(utcDayKey(a.task.startTime));
      if (a.task.lifecycleStatus === TaskLifecycleStatus.COMPLETED) completedTasks++;
    }
    const assignedTasks = assignments.length;
    const assignedDays = assignedDayKeys.size;

    const taskIds = [...new Set(assignments.map((a) => a.taskId))];
    let presentDays = 0;
    if (taskIds.length > 0 && assignedDayKeys.size > 0) {
      const ins = await this.prisma.attendance.findMany({
        where: {
          userId: workerId,
          type: 'CLOCK_IN',
          taskId: { in: taskIds },
          timestamp: { gte: since },
        },
        select: { timestamp: true },
      });
      const clockDays = new Set(ins.map((r) => utcDayKey(r.timestamp)));
      // Present on a scheduled day if worker clocked in on that UTC calendar day (any assigned task).
      presentDays = [...assignedDayKeys].filter((d) => clockDays.has(d)).length;
    }
    // Only count presence on days that had an assignment (overlap with assigned days)
    const attendance_rate = safeRatio(presentDays, assignedDays);

    const task_completion_rate = safeRatio(completedTasks, assignedTasks);

    const reportAgg = await this.prisma.fieldReport.aggregate({
      where: { userId: workerId, organizationId, timestamp: { gte: since } },
      _count: { _all: true },
    });
    const approvedCount = await this.prisma.fieldReport.count({
      where: {
        userId: workerId,
        organizationId,
        timestamp: { gte: since },
        status: ReportStatus.APPROVED,
      },
    });
    const totalReports = reportAgg._count._all ?? 0;
    const report_approval_rate = safeRatio(approvedCount, totalReports);

    const reliability_score =
      0.5 * attendance_rate + 0.3 * task_completion_rate + 0.2 * report_approval_rate;

    const category = categoryFromScore(reliability_score);
    const badge =
      category === 'reliable' ? 'High consistency' : category === 'average' ? 'Monitor' : 'Needs support';

    return {
      worker_id: workerId,
      reliability_score: Math.round(reliability_score * 1000) / 1000,
      category,
      attendance_rate: Math.round(attendance_rate * 1000) / 1000,
      task_completion_rate: Math.round(task_completion_rate * 1000) / 1000,
      report_approval_rate: Math.round(report_approval_rate * 1000) / 1000,
      present_days: presentDays,
      assigned_days: assignedDays,
      completed_tasks: completedTasks,
      assigned_tasks: assignedTasks,
      approved_reports: approvedCount,
      total_reports: totalReports,
      badge,
    };
  }

  /** Last two assignments by task start (desc); incomplete = not COMPLETED. */
  async lastTwoAssignedIncomplete(workerId: string, organizationId: string): Promise<boolean> {
    const rows = await this.prisma.taskAssignment.findMany({
      where: { userId: workerId, task: { organizationId } },
      orderBy: { task: { startTime: 'desc' } },
      take: 2,
      select: { task: { select: { lifecycleStatus: true } } },
    });
    if (rows.length < 2) return false;
    return rows.every((r) => r.task.lifecycleStatus !== TaskLifecycleStatus.COMPLETED);
  }

  async listAtRiskWorkers(organizationId: string): Promise<
    Array<{
      worker_id: string;
      worker_name: string;
      reliability_score: number;
      category: ReliabilityCategory;
      at_risk: true;
      reasons: string[];
    }>
  > {
    const volunteers = await this.prisma.user.findMany({
      where: { organizationId, role: Role.VOLUNTEER, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });
    const out: Array<{
      worker_id: string;
      worker_name: string;
      reliability_score: number;
      category: ReliabilityCategory;
      at_risk: true;
      reasons: string[];
    }> = [];
    for (const v of volunteers) {
      const rel = await this.computeReliability(v.id, organizationId);
      const last2 = await this.lastTwoAssignedIncomplete(v.id, organizationId);
      const reasons: string[] = [];
      if (rel.reliability_score < 0.5) reasons.push('reliability_score_below_0.5');
      if (last2) reasons.push('last_two_assignments_incomplete');
      if (rel.reliability_score < 0.5 || last2) {
        out.push({
          worker_id: v.id,
          worker_name: `${v.firstName} ${v.lastName}`.trim(),
          reliability_score: rel.reliability_score,
          category: rel.category,
          at_risk: true,
          reasons,
        });
      }
    }
    return out;
  }

  /** Inverse distance normalized to (0,1]; closer → higher. No location → neutral 0.5. */
  private distanceScoreMeters(distanceM: number): number {
    if (!Number.isFinite(distanceM) || distanceM < 0) return 0.5;
    return 1 / (1 + distanceM / 2000);
  }

  /** Fewer assignments today → higher score (0..1). */
  private workloadScoreToday(count: number): number {
    return 1 / (1 + count);
  }

  async suggestWorkersForTask(taskId: string, organizationId: string): Promise<WorkerSuggestion[]> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { geofenceLat: true, geofenceLng: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const assignedIds = new Set(
      (
        await this.prisma.taskAssignment.findMany({
          where: { taskId },
          select: { userId: true },
        })
      ).map((a) => a.userId),
    );

    const dayStart = startOfUtcDay(new Date());
    const dayEnd = endOfUtcDay(new Date());

    const candidates = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: Role.VOLUNTEER,
        isActive: true,
        id: { notIn: [...assignedIds] },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    const scored: WorkerSuggestion[] = [];

    for (const c of candidates) {
      const rel = await this.computeReliability(c.id, organizationId);
      const lastLoc = await this.prisma.attendance.findFirst({
        where: { userId: c.id, type: 'CLOCK_IN' },
        orderBy: { timestamp: 'desc' },
        select: { lat: true, lng: true },
      });
      let distance_score = 0.5;
      if (lastLoc) {
        const d = getDistanceFromLatLonInMeters(lastLoc.lat, lastLoc.lng, task.geofenceLat, task.geofenceLng);
        distance_score = this.distanceScoreMeters(d);
      }

      const todayAssignments = await this.prisma.taskAssignment.count({
        where: {
          userId: c.id,
          task: {
            organizationId,
            startTime: { lte: dayEnd },
            endTime: { gte: dayStart },
          },
        },
      });
      const workload_score = this.workloadScoreToday(todayAssignments);

      const score =
        0.4 * rel.reliability_score + 0.3 * distance_score + 0.3 * workload_score;

      scored.push({
        worker_id: c.id,
        worker_name: `${c.firstName} ${c.lastName}`.trim(),
        score: Math.round(score * 1000) / 1000,
        reliability_score: rel.reliability_score,
        distance_score: Math.round(distance_score * 1000) / 1000,
        workload_score: Math.round(workload_score * 1000) / 1000,
        badge: rel.badge,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
  }

  /**
   * Assigned task started + grace passed, still no timely clock-in, not on approved leave → ABSENT + suggestions.
   */
  async listTaskRiskAlerts(organizationId: string): Promise<
    Array<{
      worker_id: string;
      worker_name: string;
      task_id: string;
      task_title: string;
      status: 'ABSENT';
      task_start_time: string;
      replacement_suggestions: WorkerSuggestion[];
    }>
  > {
    const now = new Date();
    const alerts: Array<{
      worker_id: string;
      worker_name: string;
      task_id: string;
      task_title: string;
      status: 'ABSENT';
      task_start_time: string;
      replacement_suggestions: WorkerSuggestion[];
    }> = [];

    const assignments = await this.prisma.taskAssignment.findMany({
      where: {
        task: {
          organizationId,
          isActive: true,
          lifecycleStatus: { in: [TaskLifecycleStatus.PENDING, TaskLifecycleStatus.ACTIVE] },
          endTime: { gte: now },
        },
        user: { role: Role.VOLUNTEER },
      },
      select: {
        userId: true,
        taskId: true,
        user: { select: { firstName: true, lastName: true } },
        task: { select: { startTime: true, title: true } },
      },
    });

    for (const a of assignments) {
      const start = a.task.startTime;
      const deadline = new Date(start.getTime() + CHECKIN_GRACE_MINUTES * 60 * 1000);
      if (now <= deadline) continue;

      const onLeave = await this.hasApprovedLeaveAt(a.userId, start);
      if (onLeave) continue;

      const timely = await this.hasTimelyClockIn(a.userId, a.taskId, start);
      if (timely) continue;

      const replacement_suggestions = await this.suggestWorkersForTask(a.taskId, organizationId);
      alerts.push({
        worker_id: a.userId,
        worker_name: `${a.user.firstName} ${a.user.lastName}`.trim(),
        task_id: a.taskId,
        task_title: a.task.title,
        status: 'ABSENT',
        task_start_time: start.toISOString(),
        replacement_suggestions,
      });
    }
    return alerts;
  }

  /** Count absence events (same rule as task-risk) in lookback window. */
  async countAbsenceEvents(workerId: string, organizationId: string): Promise<number> {
    const since = this.absenceWindowStart();
    const now = new Date();
    let count = 0;

    const assignments = await this.prisma.taskAssignment.findMany({
      where: {
        userId: workerId,
        task: {
          organizationId,
          startTime: { gte: since, lt: now },
          isActive: true,
          lifecycleStatus: { in: [TaskLifecycleStatus.PENDING, TaskLifecycleStatus.ACTIVE, TaskLifecycleStatus.COMPLETED] },
        },
      },
      select: {
        taskId: true,
        task: { select: { startTime: true } },
      },
    });

    for (const a of assignments) {
      const start = a.task.startTime;
      const deadline = new Date(start.getTime() + CHECKIN_GRACE_MINUTES * 60 * 1000);
      if (now < deadline) continue;
      const onLeave = await this.hasApprovedLeaveAt(workerId, start);
      if (onLeave) continue;
      const timely = await this.hasTimelyClockIn(workerId, a.taskId, start);
      if (!timely) count++;
    }
    return count;
  }

  async listAbsenceRisk(organizationId: string): Promise<
    Array<{ worker_id: string; absence_events_7d: number; label: 'HIGH_RISK_ABSENCE' | 'OK' }>
  > {
    const volunteers = await this.prisma.user.findMany({
      where: { organizationId, role: Role.VOLUNTEER, isActive: true },
      select: { id: true },
    });
    const out: Array<{ worker_id: string; absence_events_7d: number; label: 'HIGH_RISK_ABSENCE' | 'OK' }> = [];
    for (const v of volunteers) {
      const absence_events_7d = await this.countAbsenceEvents(v.id, organizationId);
      out.push({
        worker_id: v.id,
        absence_events_7d,
        label: absence_events_7d >= 3 ? 'HIGH_RISK_ABSENCE' : 'OK',
      });
    }
    return out;
  }

  /** Enforce volunteer can only read self; managers read org. */
  assertCanViewWorker(
    requesterId: string,
    requesterRole: Role,
    workerId: string,
  ): void {
    const privileged: Role[] = [
      Role.SUPER_ADMIN,
      Role.NGO_ADMIN,
      Role.FIELD_COORDINATOR,
      Role.TEAM_LEADER,
      Role.HR_MANAGER,
    ];
    if (privileged.includes(requesterRole)) return;
    if (requesterRole === Role.VOLUNTEER && requesterId === workerId) return;
    throw new ForbiddenException('Not allowed to view this worker analytics');
  }
}
