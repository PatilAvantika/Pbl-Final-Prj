import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TaskLifecycleStatus } from '@prisma/client';

/** Cap org volunteers considered for map points (attendance is batched in one query). */
const MAX_VOLUNTEERS = 300;
/** How far back we load attendance for replay + last-known position. */
const ATTENDANCE_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTENDANCE_ROWS = 20_000;

type AttRow = { taskId: string | null; type: string };

@Injectable()
export class AdminMapDataService {
  constructor(private readonly prisma: PrismaService) {}

  /** After chronological replay, non-null means user has an open CLOCK_IN (same task pairing rules as clock-out). */
  private replayOpenTaskId(rows: AttRow[]): string | null {
    let open: string | null = null;
    for (const r of rows) {
      if (!r.taskId) continue;
      if (r.type === 'CLOCK_IN') {
        open = r.taskId;
      } else if (r.type === 'CLOCK_OUT' && open !== null && r.taskId === open) {
        open = null;
      }
    }
    return open;
  }

  async getMapData(organizationId: string): Promise<{
    tasks: Array<{ id: string; title: string; lat: number; lng: number; radius: number }>;
    volunteers: Array<{ id: string; name: string; lat: number; lng: number; status: 'ACTIVE' | 'INACTIVE' }>;
  }> {
    const now = new Date();
    const since = new Date(now.getTime() - ATTENDANCE_LOOKBACK_MS);

    const [tasks, volunteerUsers] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          organizationId,
          isActive: true,
          lifecycleStatus: TaskLifecycleStatus.ACTIVE,
        },
        select: {
          id: true,
          title: true,
          geofenceLat: true,
          geofenceLng: true,
          geofenceRadius: true,
        },
        orderBy: { startTime: 'desc' },
        take: 100,
      }),
      this.prisma.user.findMany({
        where: { organizationId, role: Role.VOLUNTEER, isActive: true },
        select: { id: true, firstName: true, lastName: true },
        take: MAX_VOLUNTEERS,
        orderBy: { lastName: 'asc' },
      }),
    ]);

    const taskPayload = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      lat: t.geofenceLat,
      lng: t.geofenceLng,
      radius: t.geofenceRadius,
    }));

    const ids = volunteerUsers.map((u) => u.id);
    if (ids.length === 0) {
      return { tasks: taskPayload, volunteers: [] };
    }

    const rows = await this.prisma.attendance.findMany({
      where: { userId: { in: ids }, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
      select: { userId: true, taskId: true, type: true, lat: true, lng: true, timestamp: true },
      take: MAX_ATTENDANCE_ROWS,
    });

    const byUser = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = byUser.get(r.userId) ?? [];
      list.push(r);
      byUser.set(r.userId, list);
    }

    const volunteers: Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      status: 'ACTIVE' | 'INACTIVE';
    }> = [];

    for (const u of volunteerUsers) {
      const userRows = byUser.get(u.id) ?? [];
      if (userRows.length === 0) continue;

      const last = userRows[userRows.length - 1];
      const replayRows = userRows.map((r) => ({ taskId: r.taskId, type: r.type }));
      const open = this.replayOpenTaskId(replayRows);
      const status: 'ACTIVE' | 'INACTIVE' = open !== null ? 'ACTIVE' : 'INACTIVE';

      volunteers.push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        lat: last.lat,
        lng: last.lng,
        status,
      });
    }

    return { tasks: taskPayload, volunteers };
  }
}
