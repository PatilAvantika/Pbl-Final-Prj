"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionIntelligenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const geo_util_1 = require("../utils/geo.util");
const RELIABILITY_LOOKBACK_DAYS = 90;
const ABSENCE_RISK_LOOKBACK_DAYS = 7;
const CHECKIN_GRACE_MINUTES = 30;
const EARLY_CHECKIN_MS = 60 * 60 * 1000;
function categoryFromScore(score) {
    if (score > 0.75)
        return 'reliable';
    if (score >= 0.5)
        return 'average';
    return 'at_risk';
}
function safeRatio(num, den) {
    if (den <= 0)
        return 1;
    return Math.min(1, Math.max(0, num / den));
}
function utcDayKey(d) {
    return d.toISOString().slice(0, 10);
}
function startOfUtcDay(d) {
    const x = new Date(d);
    x.setUTCHours(0, 0, 0, 0);
    return x;
}
function endOfUtcDay(d) {
    const x = new Date(d);
    x.setUTCHours(23, 59, 59, 999);
    return x;
}
let DecisionIntelligenceService = class DecisionIntelligenceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    reliabilityWindowStart() {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - RELIABILITY_LOOKBACK_DAYS);
        return d;
    }
    absenceWindowStart() {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - ABSENCE_RISK_LOOKBACK_DAYS);
        return d;
    }
    async hasApprovedLeaveAt(userId, at) {
        const n = await this.prisma.leave.count({
            where: {
                userId,
                status: client_1.LeaveStatus.APPROVED,
                startDate: { lte: at },
                endDate: { gte: at },
            },
        });
        return n > 0;
    }
    async hasTimelyClockIn(userId, taskId, taskStart) {
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
    async assertWorkerInOrganization(workerId, organizationId) {
        const u = await this.prisma.user.findFirst({
            where: { id: workerId, organizationId },
            select: { id: true },
        });
        if (!u)
            throw new common_1.NotFoundException('Worker not found in organization');
    }
    async computeReliability(workerId, organizationId) {
        await this.assertWorkerInOrganization(workerId, organizationId);
        const since = this.reliabilityWindowStart();
        const assignments = await this.prisma.taskAssignment.findMany({
            where: {
                userId: workerId,
                task: { organizationId, startTime: { gte: since } },
            },
            select: { taskId: true, task: { select: { startTime: true, lifecycleStatus: true } } },
        });
        const assignedDayKeys = new Set();
        let completedTasks = 0;
        for (const a of assignments) {
            assignedDayKeys.add(utcDayKey(a.task.startTime));
            if (a.task.lifecycleStatus === client_1.TaskLifecycleStatus.COMPLETED)
                completedTasks++;
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
            presentDays = [...assignedDayKeys].filter((d) => clockDays.has(d)).length;
        }
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
                status: client_1.ReportStatus.APPROVED,
            },
        });
        const totalReports = reportAgg._count._all ?? 0;
        const report_approval_rate = safeRatio(approvedCount, totalReports);
        const reliability_score = 0.5 * attendance_rate + 0.3 * task_completion_rate + 0.2 * report_approval_rate;
        const category = categoryFromScore(reliability_score);
        const badge = category === 'reliable' ? 'High consistency' : category === 'average' ? 'Monitor' : 'Needs support';
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
    async lastTwoAssignedIncomplete(workerId, organizationId) {
        const rows = await this.prisma.taskAssignment.findMany({
            where: { userId: workerId, task: { organizationId } },
            orderBy: { task: { startTime: 'desc' } },
            take: 2,
            select: { task: { select: { lifecycleStatus: true } } },
        });
        if (rows.length < 2)
            return false;
        return rows.every((r) => r.task.lifecycleStatus !== client_1.TaskLifecycleStatus.COMPLETED);
    }
    async listAtRiskWorkers(organizationId) {
        const volunteers = await this.prisma.user.findMany({
            where: { organizationId, role: client_1.Role.VOLUNTEER, isActive: true },
            select: { id: true, firstName: true, lastName: true },
        });
        const out = [];
        for (const v of volunteers) {
            const rel = await this.computeReliability(v.id, organizationId);
            const last2 = await this.lastTwoAssignedIncomplete(v.id, organizationId);
            const reasons = [];
            if (rel.reliability_score < 0.5)
                reasons.push('reliability_score_below_0.5');
            if (last2)
                reasons.push('last_two_assignments_incomplete');
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
    distanceScoreMeters(distanceM) {
        if (!Number.isFinite(distanceM) || distanceM < 0)
            return 0.5;
        return 1 / (1 + distanceM / 2000);
    }
    workloadScoreToday(count) {
        return 1 / (1 + count);
    }
    async suggestWorkersForTask(taskId, organizationId) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, organizationId },
            select: { geofenceLat: true, geofenceLng: true },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const assignedIds = new Set((await this.prisma.taskAssignment.findMany({
            where: { taskId },
            select: { userId: true },
        })).map((a) => a.userId));
        const dayStart = startOfUtcDay(new Date());
        const dayEnd = endOfUtcDay(new Date());
        const candidates = await this.prisma.user.findMany({
            where: {
                organizationId,
                role: client_1.Role.VOLUNTEER,
                isActive: true,
                id: { notIn: [...assignedIds] },
            },
            select: { id: true, firstName: true, lastName: true },
        });
        const scored = [];
        for (const c of candidates) {
            const rel = await this.computeReliability(c.id, organizationId);
            const lastLoc = await this.prisma.attendance.findFirst({
                where: { userId: c.id, type: 'CLOCK_IN' },
                orderBy: { timestamp: 'desc' },
                select: { lat: true, lng: true },
            });
            let distance_score = 0.5;
            if (lastLoc) {
                const d = (0, geo_util_1.getDistanceFromLatLonInMeters)(lastLoc.lat, lastLoc.lng, task.geofenceLat, task.geofenceLng);
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
            const score = 0.4 * rel.reliability_score + 0.3 * distance_score + 0.3 * workload_score;
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
    async listTaskRiskAlerts(organizationId) {
        const now = new Date();
        const alerts = [];
        const assignments = await this.prisma.taskAssignment.findMany({
            where: {
                task: {
                    organizationId,
                    isActive: true,
                    lifecycleStatus: { in: [client_1.TaskLifecycleStatus.PENDING, client_1.TaskLifecycleStatus.ACTIVE] },
                    endTime: { gte: now },
                },
                user: { role: client_1.Role.VOLUNTEER },
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
            if (now <= deadline)
                continue;
            const onLeave = await this.hasApprovedLeaveAt(a.userId, start);
            if (onLeave)
                continue;
            const timely = await this.hasTimelyClockIn(a.userId, a.taskId, start);
            if (timely)
                continue;
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
    async countAbsenceEvents(workerId, organizationId) {
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
                    lifecycleStatus: { in: [client_1.TaskLifecycleStatus.PENDING, client_1.TaskLifecycleStatus.ACTIVE, client_1.TaskLifecycleStatus.COMPLETED] },
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
            if (now < deadline)
                continue;
            const onLeave = await this.hasApprovedLeaveAt(workerId, start);
            if (onLeave)
                continue;
            const timely = await this.hasTimelyClockIn(workerId, a.taskId, start);
            if (!timely)
                count++;
        }
        return count;
    }
    async listAbsenceRisk(organizationId) {
        const volunteers = await this.prisma.user.findMany({
            where: { organizationId, role: client_1.Role.VOLUNTEER, isActive: true },
            select: { id: true },
        });
        const out = [];
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
    assertCanViewWorker(requesterId, requesterRole, workerId) {
        const privileged = [
            client_1.Role.SUPER_ADMIN,
            client_1.Role.NGO_ADMIN,
            client_1.Role.FIELD_COORDINATOR,
            client_1.Role.TEAM_LEADER,
            client_1.Role.HR_MANAGER,
        ];
        if (privileged.includes(requesterRole))
            return;
        if (requesterRole === client_1.Role.VOLUNTEER && requesterId === workerId)
            return;
        throw new common_1.ForbiddenException('Not allowed to view this worker analytics');
    }
};
exports.DecisionIntelligenceService = DecisionIntelligenceService;
exports.DecisionIntelligenceService = DecisionIntelligenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DecisionIntelligenceService);
//# sourceMappingURL=decision-intelligence.service.js.map