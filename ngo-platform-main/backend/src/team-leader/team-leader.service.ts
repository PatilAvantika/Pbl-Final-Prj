import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus, Role, TaskLifecycleStatus } from '@prisma/client';

@Injectable()
export class TeamLeaderService {
    constructor(private readonly prisma: PrismaService) {}

    async getDashboard(userId: string, organizationId: string) {
        const tasks = await this.prisma.task.findMany({
            where: {
                organizationId,
                OR: [{ teamLeaderId: userId }, { teamLeaderId: null, assignments: { some: { userId } } }],
            },
            select: { id: true, lifecycleStatus: true },
        });
        const ids = tasks.map((t) => t.id);
        if (ids.length === 0) {
            return {
                totalTasks: 0,
                activeTasks: 0,
                totalVolunteers: 0,
                attendanceToday: 0,
                reportsSubmitted: 0,
                reportsPending: 0,
                reportsApproved: 0,
                reportsRejected: 0,
            };
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const totalTasks = ids.length;
        const activeTasks = tasks.filter(
            (t) => t.lifecycleStatus === TaskLifecycleStatus.PENDING || t.lifecycleStatus === TaskLifecycleStatus.ACTIVE,
        ).length;

        const assignRows = await this.prisma.taskAssignment.findMany({
            where: { taskId: { in: ids } },
            select: { userId: true, user: { select: { role: true } } },
        });
        const volunteerIds = new Set(
            assignRows.filter((a) => a.user.role === Role.VOLUNTEER).map((a) => a.userId),
        );
        const totalVolunteers = volunteerIds.size;

        const attendanceToday = await this.prisma.attendance.count({
            where: { taskId: { in: ids }, timestamp: { gte: startOfDay, lte: endOfDay } },
        });

        const [reportsSubmitted, reportsPending, reportsApproved, reportsRejected] = await Promise.all([
            this.prisma.fieldReport.count({ where: { taskId: { in: ids }, organizationId } }),
            this.prisma.fieldReport.count({
                where: { taskId: { in: ids }, organizationId, status: ReportStatus.SUBMITTED },
            }),
            this.prisma.fieldReport.count({
                where: { taskId: { in: ids }, organizationId, status: ReportStatus.APPROVED },
            }),
            this.prisma.fieldReport.count({
                where: { taskId: { in: ids }, organizationId, status: ReportStatus.REJECTED },
            }),
        ]);

        return {
            totalTasks,
            activeTasks,
            totalVolunteers,
            attendanceToday,
            reportsSubmitted,
            reportsPending,
            reportsApproved,
            reportsRejected,
        };
    }
}
