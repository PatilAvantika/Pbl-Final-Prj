'use client';

import { Loader2, Shield } from 'lucide-react';
import type { ReliabilityCategory, WorkerReliabilityResponse } from '../types';

function categoryVisual(cat: ReliabilityCategory): { label: string; emoji: string; ring: string; badgeBg: string; badgeText: string } {
  if (cat === 'reliable') {
    return {
      label: 'Reliable',
      emoji: '🟢',
      ring: 'ring-emerald-400/60',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      badgeText: 'On track',
    };
  }
  if (cat === 'average') {
    return {
      label: 'Average',
      emoji: '🟡',
      ring: 'ring-amber-400/60',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      badgeText: 'Watch',
    };
  }
  return {
    label: 'At risk',
    emoji: '🔴',
    ring: 'ring-red-400/60',
    badgeBg: 'bg-red-100 text-red-900 border-red-200',
    badgeText: 'Needs support',
  };
}

type Props = {
  data: WorkerReliabilityResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
};

export function ReliabilityScoreCard({ data, isLoading, error, onRetry }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 shrink-0" />
        <span className="text-sm font-semibold">Loading reliability…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-sm text-amber-900">
        <p className="font-bold">Reliability unavailable</p>
        <p className="mt-1 text-amber-800">{error?.message ?? 'Could not load score.'}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="mt-3 text-sm font-bold underline text-amber-950">
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  const pct = Math.round(data.reliability_score * 100);
  const v = categoryVisual(data.category);

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ring-2 ${v.ring}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Decision intelligence</p>
            <p className="text-sm font-bold text-slate-800 truncate">Field reliability score</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border shrink-0 ${v.badgeBg}`}>
          {v.emoji} {v.label}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-1">
        <span className="text-4xl font-black text-slate-900 tabular-nums">{pct}%</span>
        <span className="text-sm font-semibold text-slate-500 mb-1">({data.reliability_score.toFixed(2)} index)</span>
      </div>
      <p className="text-xs font-medium text-slate-500 mb-4">{data.badge}</p>

      <div className="grid grid-cols-3 gap-2 text-center rounded-xl bg-slate-50 border border-slate-100 p-3">
        <div>
          <p className="text-lg font-extrabold text-slate-800">{Math.round(data.attendance_rate * 100)}%</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Attendance</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-slate-800">{Math.round(data.task_completion_rate * 100)}%</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Tasks</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-slate-800">{Math.round(data.report_approval_rate * 100)}%</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Reports</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 font-medium">
        Based on last ~90 days of assignments, clock-ins on scheduled days, task completion, and report outcomes.
      </p>
    </div>
  );
}
