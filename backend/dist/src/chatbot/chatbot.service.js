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
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const decision_intelligence_service_1 = require("../analytics/decision-intelligence.service");
const DEFAULT_ACTIONS = ['my tasks', 'am i at risk', 'help'];
const MANAGER_ROLES = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.NGO_ADMIN,
    client_1.Role.FIELD_COORDINATOR,
    client_1.Role.TEAM_LEADER,
    client_1.Role.HR_MANAGER,
    client_1.Role.FINANCE_MANAGER,
];
let ChatbotService = class ChatbotService {
    prisma;
    decision;
    constructor(prisma, decision) {
        this.prisma = prisma;
        this.decision = decision;
    }
    async handleQuery(message, actorId, actorRole, organizationId) {
        const raw = message.trim();
        const m = raw.toLowerCase();
        if (!organizationId) {
            return {
                reply: 'Your account is not linked to an organization, so I cannot load field data.',
                actions: ['help'],
            };
        }
        if (m === 'help' || m === '?') {
            return {
                reply: 'I can help with quick field checks.\n\n' +
                    'Volunteers: try “my tasks”, “am i at risk”, or “mark attendance”.\n' +
                    'Coordinators: try “at risk workers” or “task suggestions” plus a task ID.\n\n' +
                    'Commands are matched as plain text (no AI).',
                actions: MANAGER_ROLES.includes(actorRole)
                    ? [...DEFAULT_ACTIONS, 'at risk workers', 'task suggestions']
                    : DEFAULT_ACTIONS,
            };
        }
        if (m === 'my tasks' || m === 'tasks') {
            const rows = await this.prisma.taskAssignment.findMany({
                where: { userId: actorId, task: { organizationId } },
                orderBy: { task: { startTime: 'desc' } },
                take: 8,
                select: { task: { select: { id: true, title: true, startTime: true, lifecycleStatus: true } } },
            });
            const lines = rows.map((r) => `• ${r.task.title} (${r.task.lifecycleStatus})`);
            return {
                reply: lines.length > 0
                    ? `Here are your recent assignments:\n${lines.join('\n')}`
                    : 'You have no assigned tasks in this organization right now.',
                data: { tasks: rows.map((r) => r.task) },
                actions: DEFAULT_ACTIONS,
            };
        }
        if (m === 'am i at risk' || m === 'my risk' || m === 'risk') {
            const rel = await this.decision.computeReliability(actorId, organizationId);
            const last2 = await this.decision.lastTwoAssignedIncomplete(actorId, organizationId);
            const atRisk = rel.reliability_score < 0.5 || last2;
            return {
                reply: atRisk
                    ? `You are flagged at-risk right now (score ${rel.reliability_score}, category ${rel.category}). Reasons may include low reliability or the last two assignments not completed. Reach out to your coordinator.`
                    : `You look OK for now: reliability ${rel.reliability_score} (${rel.category}). Keep up consistent attendance and reports.`,
                data: { ...rel, at_risk: atRisk, last_two_incomplete: last2 },
                actions: DEFAULT_ACTIONS,
            };
        }
        if (m === 'at risk workers' || m === 'at-risk workers') {
            if (!MANAGER_ROLES.includes(actorRole)) {
                return {
                    reply: 'Only coordinators and admins can list all at-risk workers. Try “am i at risk” for your own status.',
                    actions: DEFAULT_ACTIONS,
                };
            }
            const list = await this.decision.listAtRiskWorkers(organizationId);
            return {
                reply: list.length === 0
                    ? 'No volunteers are currently flagged at-risk in your org.'
                    : `${list.length} volunteer(s) flagged at-risk. See the Admin dashboard “At-Risk Workers” table for details.`,
                data: { workers: list },
                actions: [...DEFAULT_ACTIONS, 'at risk workers'],
            };
        }
        if (m === 'mark attendance' || m === 'attendance' || m === 'clock in') {
            return {
                reply: 'Open My Tasks, pick your deployment, then use Clock In to Zone (GPS + face verification). I cannot clock you in from chat.',
                actions: DEFAULT_ACTIONS,
            };
        }
        const sugMatch = m.match(/task\s*suggestions?\s*(?:for\s*)?([0-9a-f-]{36})/i);
        const uuidMatch = sugMatch?.[1] ?? (m.startsWith('suggestions') ? m.match(/([0-9a-f-]{36})/i)?.[1] : undefined);
        if (m.includes('task suggestion') || m.startsWith('suggestions')) {
            if (!MANAGER_ROLES.includes(actorRole) && actorRole !== client_1.Role.VOLUNTEER) {
                return {
                    reply: 'Task suggestions are available to volunteers (for tasks they are on) and to coordinators.',
                    actions: ['help'],
                };
            }
            const taskId = uuidMatch;
            if (!taskId) {
                return {
                    reply: 'Say “task suggestions” followed by a task UUID, e.g. task suggestions <paste-id>, or open a task in the app and use the Suggested Workers panel.',
                    actions: ['help'],
                };
            }
            if (actorRole === client_1.Role.VOLUNTEER) {
                const ok = await this.prisma.taskAssignment.findUnique({
                    where: { userId_taskId: { userId: actorId, taskId } },
                });
                if (!ok) {
                    return { reply: 'You are not assigned to that task, so I cannot show suggestions for it.', actions: ['help'] };
                }
            }
            const suggestions = await this.decision.suggestWorkersForTask(taskId, organizationId);
            return {
                reply: suggestions.length > 0
                    ? `Top picks for that task:\n${suggestions.map((s) => `• ${s.worker_name} (score ${s.score})`).join('\n')}`
                    : 'No alternate volunteers available to suggest (everyone may already be assigned).',
                data: { task_id: taskId, suggestions },
                actions: DEFAULT_ACTIONS,
            };
        }
        return {
            reply: 'I did not understand that. Try “help”, or short commands like “my tasks” or “am i at risk”.',
            actions: DEFAULT_ACTIONS,
        };
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        decision_intelligence_service_1.DecisionIntelligenceService])
], ChatbotService);
//# sourceMappingURL=chatbot.service.js.map