'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export default function StaffDashboardPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['staff', 'summary'],
        queryFn: async () => (await api.get<{ scope: string; message: string }>('/staff/summary')).data,
    });

    return (
        <div className="max-w-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Staff dashboard</h2>
            <p className="text-slate-600 text-sm">
                Limited operational access — full administration remains in the admin portal for authorized roles only.
            </p>
            {isLoading && <p className="text-slate-500">Loading…</p>}
            {isError && <p className="text-red-600 text-sm">Could not load staff summary.</p>}
            {data && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="font-semibold text-slate-800">{data.message}</p>
                    <p className="text-xs text-slate-500 mt-2">Scope: {data.scope}</p>
                </div>
            )}
        </div>
    );
}
