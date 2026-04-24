import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma, TaskLifecycleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { AuditService } from '../audit/audit.service';
import type { AdminTasksQueryDto } from './dto/admin-tasks-query.dto';
import type { AdminPatchTaskDto } from './dto/admin-patch-task.dto';

export type AdminTaskListItem = {
  id: string;
  title: string;
  locationName: string;
  status: TaskLifecycleStatus;
  template: string;
  assignmentsCount: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  geofenceLat: number;
  geofenceLng: number;
  geofenceRadius: number;
  description: string | null;
};

@Injectable()
export class AdminTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly auditService: AuditService,
  ) {}

  async list(organizationId: string, query: AdminTasksQueryDto): Promise<{
    tasks: AdminTaskListItem[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = query.offset ?? 0;

    const where: Prisma.TaskWhereInput = { organizationId };

    if (query.lifecycleStatus) {
      where.lifecycleStatus = query.lifecycleStatus;
    }

    if (query.from || query.to) {
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;
      if (from && Number.isNaN(from.getTime())) {
        throw new BadRequestException('Invalid "from" date');
      }
      if (to && Number.isNaN(to.getTime())) {
        throw new BadRequestException('Invalid "to" date');
      }
      if (from && to) {
        where.AND = [{ startTime: { lte: to } }, { endTime: { gte: from } }];
      } else if (from) {
        where.endTime = { gte: from };
      } else if (to) {
        where.startTime = { lte: to };
      }
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { zoneName: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query.template) {
      where.template = query.template;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: { _count: { select: { assignments: true } } },
      }),
      this.prisma.task.count({ where }),
    ]);

    const tasks: AdminTaskListItem[] = rows.map((t) => ({
      id: t.id,
      title: t.title,
      locationName: t.zoneName,
      status: t.lifecycleStatus,
      template: t.template,
      assignmentsCount: t._count.assignments,
      startTime: t.startTime,
      endTime: t.endTime,
      isActive: t.isActive,
      geofenceLat: t.geofenceLat,
      geofenceLng: t.geofenceLng,
      geofenceRadius: t.geofenceRadius,
      description: t.description,
    }));

    return { tasks, total, limit, offset };
  }

  async findOne(organizationId: string, id: string) {
    return this.tasksService.findOneInOrganization(id, organizationId);
  }

  private async replaceAssignments(
    taskId: string,
    organizationId: string,
    userIds: string[],
  ): Promise<void> {
    await this.tasksService.findOneInOrganization(taskId, organizationId);

    if (userIds.length === 0) {
      await this.prisma.taskAssignment.deleteMany({ where: { taskId } });
      return;
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, organizationId },
      select: { id: true },
    });
    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more users are not in your organization');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.taskAssignment.deleteMany({ where: { taskId } });
      await tx.taskAssignment.createMany({
        data: userIds.map((userId) => ({ userId, taskId })),
        skipDuplicates: true,
      });
    });
  }

  async patch(
    organizationId: string,
    taskId: string,
    dto: AdminPatchTaskDto,
    actorId?: string,
  ) {
    const { assignedUserIds, lifecycleStatus, ...scalarRest } = dto;

    if (assignedUserIds !== undefined) {
      await this.replaceAssignments(taskId, organizationId, assignedUserIds);
    }

    const prismaUpdate: Prisma.TaskUpdateInput = {};
    const sr = scalarRest as Record<string, unknown>;
    for (const key of [
      'title',
      'description',
      'template',
      'zoneName',
      'geofenceLat',
      'geofenceLng',
      'geofenceRadius',
      'startTime',
      'endTime',
      'isActive',
    ] as const) {
      if (sr[key] !== undefined) {
        (prismaUpdate as Record<string, unknown>)[key] = sr[key];
      }
    }
    if (lifecycleStatus !== undefined) {
      prismaUpdate.lifecycleStatus = lifecycleStatus;
    }

    let task;
    if (Object.keys(prismaUpdate).length > 0) {
      task = await this.tasksService.update(taskId, organizationId, prismaUpdate);
    } else {
      task = await this.tasksService.findOneInOrganization(taskId, organizationId);
    }

    await this.auditService.log({
      actorId,
      action: AuditAction.TASK_UPDATED,
      entityType: 'Task',
      entityId: taskId,
      metadata: {
        assignedUserIdsUpdated: assignedUserIds !== undefined,
        fields: Object.keys(prismaUpdate),
      },
    });

    return task;
  }

  async softDelete(organizationId: string, taskId: string, actorId?: string) {
    const existing = await this.tasksService.findOneInOrganization(taskId, organizationId);
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        lifecycleStatus: TaskLifecycleStatus.CANCELLED,
        isActive: false,
      },
    });
    await this.auditService.log({
      actorId,
      action: AuditAction.TASK_DELETED,
      entityType: 'Task',
      entityId: taskId,
      metadata: { title: existing.title, soft: true },
    });
    return task;
  }
}
