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
exports.AdminMapDataService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const MAX_VOLUNTEERS = 300;
const ATTENDANCE_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTENDANCE_ROWS = 20_000;
let AdminMapDataService = class AdminMapDataService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    replayOpenTaskId(rows) {
        let open = null;
        for (const r of rows) {
            if (!r.taskId)
                continue;
            if (r.type === 'CLOCK_IN') {
                open = r.taskId;
            }
            else if (r.type === 'CLOCK_OUT' && open !== null && r.taskId === open) {
                open = null;
            }
        }
        return open;
    }
    async getMapData(organizationId) {
        const now = new Date();
        const since = new Date(now.getTime() - ATTENDANCE_LOOKBACK_MS);
        const [tasks, volunteerUsers] = await Promise.all([
            this.prisma.task.findMany({
                where: {
                    organizationId,
                    isActive: true,
                    lifecycleStatus: client_1.TaskLifecycleStatus.ACTIVE,
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
                where: { organizationId, role: client_1.Role.VOLUNTEER, isActive: true },
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
        const byUser = new Map();
        for (const r of rows) {
            const list = byUser.get(r.userId) ?? [];
            list.push(r);
            byUser.set(r.userId, list);
        }
        const volunteers = [];
        for (const u of volunteerUsers) {
            const userRows = byUser.get(u.id) ?? [];
            if (userRows.length === 0)
                continue;
            const last = userRows[userRows.length - 1];
            const replayRows = userRows.map((r) => ({ taskId: r.taskId, type: r.type }));
            const open = this.replayOpenTaskId(replayRows);
            const status = open !== null ? 'ACTIVE' : 'INACTIVE';
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
};
exports.AdminMapDataService = AdminMapDataService;
exports.AdminMapDataService = AdminMapDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminMapDataService);
//# sourceMappingURL=admin-map-data.service.js.map