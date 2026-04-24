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
exports.TaskAssignmentOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const open_task_strategy_1 = require("../domain/task-assignment/open-task.strategy");
const bulk_task_strategy_1 = require("../domain/task-assignment/bulk-task.strategy");
let TaskAssignmentOrchestratorService = class TaskAssignmentOrchestratorService {
    openStrategy;
    bulkStrategy;
    constructor(openStrategy, bulkStrategy) {
        this.openStrategy = openStrategy;
        this.bulkStrategy = bulkStrategy;
    }
    async assign(mode, ctx) {
        const strategy = mode === 'open' ? this.openStrategy : mode === 'bulk' ? this.bulkStrategy : null;
        if (!strategy) {
            throw new common_1.BadRequestException('Invalid assignment mode (use open or bulk)');
        }
        return strategy.assign(ctx);
    }
};
exports.TaskAssignmentOrchestratorService = TaskAssignmentOrchestratorService;
exports.TaskAssignmentOrchestratorService = TaskAssignmentOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [open_task_strategy_1.OpenTaskAssignmentStrategy,
        bulk_task_strategy_1.BulkTaskAssignmentStrategy])
], TaskAssignmentOrchestratorService);
//# sourceMappingURL=task-assignment-orchestrator.service.js.map