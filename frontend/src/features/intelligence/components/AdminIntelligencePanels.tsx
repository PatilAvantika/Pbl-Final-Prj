'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Users } from 'lucide-react';
import { fetchAtRiskWorkers, fetchTaskRiskAlerts } from '../intelligence-api';
import type { AtRiskWorkerRow, TaskRiskAlert } from '../types';

function reasonLabel(r: string): string {
  if (r === 'reliability_score_below_0.5') return 'Low reliability score';
  if (r === 'last_two_assignments_incomplete') return 'Last 2 assignments not completed';
  return r.replace(/_/g, ' ');
}

export function AdminIntelligencePanels() {
  const atRisk = useQuery({
    queryKey: ['intelligence', 'at-risk-workers'],
    queryFn: fetchAtRiskWorkers,
    refetchInterval: 45_000,
  });

  const taskRisk = useQuery({
    queryKey: ['intelligence', 'task-risk-alerts'],
    queryFn: fetchTaskRiskAlerts,
    refetchInterval: 45_000,
  });

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">At-risk workers</h2>
            <p className="text-xs font-medium text-slate-500">From reliability score & recent incomplete assignments</p>
          </div>
        </div>

        {atRisk.isPending ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            <span className="text-sm font-semibold">Loading…</span>
          </div>
        ) : atRisk.isError ? (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not load at-risk list. You may lack permission or the server is unavailable.
          </p>
        ) : !atRisk.data?.length ? (
          <p className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900">
            No volunteers flagged at-risk right now.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.data.map((row: AtRiskWorkerRow) => (
                  <tr key={row.worker_id} className="border-t border-red-100 bg-red-50/40 hover:bg-red-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.worker_name}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-red-800">{row.reliability_score.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-800">
                        At risk
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700" title={row.reasons.join(', ')}>
                      {row.reasons.map(reasonLabel).join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Alerts · Task risk</h2>
            <p className="text-xs font-medium text-slate-500">Absent after start + 30 min (not on approved leave)</p>
          </div>
        </div>

        {taskRisk.isPending ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span className="text-sm font-semibold">Loading…</span>
          </div>
        ) : taskRisk.isError ? (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not load task-risk alerts.
          </p>
        ) : !taskRisk.data?.length ? (
          <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">No active absence alerts.</p>
        ) : (
          <ul className="space-y-3">
            {taskRisk.data.map((a: TaskRiskAlert) => (
              <li
                key={`${a.worker_id}-${a.task_id}`}
                className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-amber-50/80 p-4 shadow-sm"
              >
                <p className="text-sm font-extrabold text-red-900">
                  ⚠ Absent · {a.worker_name}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-700">
                  Task: <span className="font-bold">{a.task_title}</span> · Started{' '}
                  {new Date(a.task_start_time).toLocaleString()}
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-amber-800">Suggested replacements</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-800">
                  {a.replacement_suggestions.map((s) => (
                    <li key={s.worker_id}>
                      • {s.worker_name} — score {s.score}{' '}
                      <span className="text-slate-500">
                        (dist {s.distance_score}, load {s.workload_score})
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
