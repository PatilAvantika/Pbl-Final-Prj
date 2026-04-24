import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelVolunteerLeave, createLeave, type CreateVolunteerLeavePayload } from '../services/volunteer-api';
import { volunteerLeaveSummaryQueryKey } from './useLeaveSummary';
import { volunteerLeavesQueryKey } from './useLeaves';

async function invalidateLeaveQueries(qc: ReturnType<typeof useQueryClient>) {
    await Promise.all([
        qc.invalidateQueries({ queryKey: volunteerLeavesQueryKey }),
        qc.invalidateQueries({ queryKey: volunteerLeaveSummaryQueryKey }),
    ]);
}

export const useCreateVolunteerLeave = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateVolunteerLeavePayload) => createLeave(payload),
        onSuccess: () => invalidateLeaveQueries(qc),
    });
};

export const useCancelVolunteerLeave = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (leaveId: string) => cancelVolunteerLeave(leaveId),
        onSuccess: () => invalidateLeaveQueries(qc),
    });
};
