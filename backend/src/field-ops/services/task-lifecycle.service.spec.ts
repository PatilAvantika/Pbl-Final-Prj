import { BadRequestException } from '@nestjs/common';
import { TaskLifecycleStatus } from '@prisma/client';
import { assertTaskLifecycleTransition } from '../domain/task-state-machine';

describe('TaskLifecycle state machine', () => {
    it('allows PENDING → ACTIVE', () => {
        expect(() =>
            assertTaskLifecycleTransition(TaskLifecycleStatus.PENDING, TaskLifecycleStatus.ACTIVE),
        ).not.toThrow();
    });

    it('rejects COMPLETED → ACTIVE', () => {
        expect(() =>
            assertTaskLifecycleTransition(TaskLifecycleStatus.COMPLETED, TaskLifecycleStatus.ACTIVE),
        ).toThrow(BadRequestException);
    });
});
