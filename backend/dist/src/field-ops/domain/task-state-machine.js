"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTaskLifecycleTransition = assertTaskLifecycleTransition;
exports.lifecycleToTaskFlags = lifecycleToTaskFlags;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const allowed = {
    [client_1.TaskLifecycleStatus.PENDING]: [client_1.TaskLifecycleStatus.ACTIVE, client_1.TaskLifecycleStatus.CANCELLED],
    [client_1.TaskLifecycleStatus.ACTIVE]: [client_1.TaskLifecycleStatus.COMPLETED, client_1.TaskLifecycleStatus.CANCELLED],
    [client_1.TaskLifecycleStatus.COMPLETED]: [],
    [client_1.TaskLifecycleStatus.CANCELLED]: [],
};
function assertTaskLifecycleTransition(from, to) {
    if (from === to)
        return;
    if (!allowed[from]?.includes(to)) {
        throw new common_1.BadRequestException(`Invalid task lifecycle transition ${from} → ${to}`);
    }
}
function lifecycleToTaskFlags(to) {
    switch (to) {
        case client_1.TaskLifecycleStatus.PENDING:
            return { isActive: true, lifecycleStatus: client_1.TaskLifecycleStatus.PENDING };
        case client_1.TaskLifecycleStatus.ACTIVE:
            return { isActive: true, lifecycleStatus: client_1.TaskLifecycleStatus.ACTIVE };
        case client_1.TaskLifecycleStatus.COMPLETED:
            return { isActive: false, lifecycleStatus: client_1.TaskLifecycleStatus.COMPLETED };
        case client_1.TaskLifecycleStatus.CANCELLED:
            return { isActive: false, lifecycleStatus: client_1.TaskLifecycleStatus.CANCELLED };
        default:
            return { isActive: true, lifecycleStatus: to };
    }
}
//# sourceMappingURL=task-state-machine.js.map