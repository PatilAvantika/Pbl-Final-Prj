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
exports.AdminPatchTaskDto = void 0;
const client_1 = require("@prisma/client");
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
const task_mutations_dto_1 = require("../../tasks/dto/task-mutations.dto");
class AdminPatchTaskDto extends (0, mapped_types_1.PartialType)(task_mutations_dto_1.UpdateTaskDto) {
    lifecycleStatus;
    assignedUserIds;
}
exports.AdminPatchTaskDto = AdminPatchTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskLifecycleStatus),
    __metadata("design:type", String)
], AdminPatchTaskDto.prototype, "lifecycleStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], AdminPatchTaskDto.prototype, "assignedUserIds", void 0);
//# sourceMappingURL=admin-patch-task.dto.js.map