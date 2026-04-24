'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
import { fetchAiTaskSuggestions } from '../intelligence-api';
import type { WorkerSuggestion } from '../types';

type Props = { taskId: string };

export function TaskSuggestionsPanel({ taskId }: Props) {
  const q = useQuery({
    queryKey: ['intelligence', 'ai-task-suggestions', taskId],
    queryFn: () => fetchAiTaskSuggestions(taskId),
    enabled: Boolean(taskId),
  });

  if (q.isPending) {
    return (
      <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white py-8 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading suggestions…</span>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Suggestions unavailable (permissions or network).
      </div>
    );
  }

  const rows: WorkerSuggestion[] = q.data?.suggestions ?? [];
  const source = q.data?.source ?? 'fallback';
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-center text-sm text-slate-500">
        No alternate volunteers to suggest right now.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <UserPlus className="h-5 w-5 text-emerald-600" />
        <h3 className="text-sm font-extrabold text-slate-800">Recommended Volunteers (Admin Only)</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
            source === 'ai' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {source === 'ai' ? 'AI ranking' : 'Rule engine'}
        </span>
      </div>
      <p className="mb-3 text-[11px] font-medium text-slate-500">
        Top picks by reliability, distance to zone, and today&apos;s workload. Microservice when available — else existing logic.
      </p>
      <ul className="space-y-3">
        {rows.map((s, idx) => (
          <li
            key={s.worker_id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-800">
                #{idx + 1} {s.worker_name}
              </p>
              <p className="text-[10px] font-medium text-slate-500">
                Reliability {s.reliability_score.toFixed(2)} · Distance {s.distance_score.toFixed(2)} · Workload{' '}
                {s.workload_score.toFixed(2)}
              </p>
              <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-800">
                {s.badge}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-black text-emerald-700 tabular-nums">{s.score.toFixed(2)}</p>
              <p className="text-[9px] font-bold uppercase text-slate-400">Score</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
        Assignment is done by your coordinator in Admin → Tasks.
      </p>
    </div>
  );
}
