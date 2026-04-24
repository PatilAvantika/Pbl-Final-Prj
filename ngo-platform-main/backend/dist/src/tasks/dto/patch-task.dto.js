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
exports.AssignStrategyDto = exports.PatchTaskDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const task_mutations_dto_1 = require("./task-mutations.dto");
class PatchTaskDto extends (0, mapped_types_1.PartialType)(task_mutations_dto_1.UpdateTaskDto) {
    lifecycleStatus;
    status;
    assigneeIds;
}
exports.PatchTaskDto = PatchTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskLifecycleStatus),
    __metadata("design:type", String)
], PatchTaskDto.prototype, "lifecycleStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PENDING', 'IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
    __metadata("design:type", String)
], PatchTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], PatchTaskDto.prototype, "assigneeIds", void 0);
class AssignStrategyDto {
    mode;
    userIds;
}
exports.AssignStrategyDto = AssignStrategyDto;
__decorate([
    (0, class_validator_1.IsIn)(['open', 'bulk']),
    __metadata("design:type", String)
], AssignStrategyDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], AssignStrategyDto.prototype, "userIds", void 0);
//# sourceMappingURL=patch-task.dto.js.map