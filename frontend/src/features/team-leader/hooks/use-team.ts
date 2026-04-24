import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { unwrapTeamVolunteers } from '@/features/team-leader/lib/unwrap';
import type { Volunteer } from '@/features/team-leader/types/team-leader';
import { toast } from 'sonner';

export const teamKeys = {
    all: ['team'] as const,
};

export function useTeam() {
    return useQuery({
        queryKey: teamKeys.all,
        queryFn: async () => {
            const { data } = await api.get<unknown>('/team');
            return unwrapTeamVolunteers(data);
        },
    });
}

export function useOptimisticTeamAssign() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            volunteers,
            volunteerId,
            assign,
        }: {
            volunteers: Volunteer[];
            volunteerId: string;
            assign: boolean;
        }) => {
            const next = volunteers.map((v) =>
                v.id === volunteerId ? { ...v, teamId: assign ? 'on-roster' : null } : v
            );
            const { data } = await api.patch<unknown>('/team', { volunteers: next });
            return unwrapTeamVolunteers(data ?? { volunteers: next });
        },
        onMutate: async ({ volunteers, volunteerId, assign }) => {
            await qc.cancelQueries({ queryKey: teamKeys.all });
            const prev = qc.getQueryData<Volunteer[]>(teamKeys.all);
            const optimistic = volunteers.map((v) =>
                v.id === volunteerId ? { ...v, teamId: assign ? 'current' : null } : v
            );
            qc.setQueryData(teamKeys.all, optimistic);
            return { prev };
        },
        onError: (e, _v, ctx) => {
            if (ctx?.prev) qc.setQueryData(teamKeys.all, ctx.prev);
            toast.error(getApiErrorMessage(e, 'Could not update volunteer'));
        },
        onSuccess: (list) => {
            qc.setQueryData(teamKeys.all, list);
            toast.success('Volunteer updated');
        },
    });
}
