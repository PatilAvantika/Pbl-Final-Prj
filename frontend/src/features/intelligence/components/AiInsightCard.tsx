'use client';

import { Loader2, Sparkles } from 'lucide-react';
import type { AiReliabilityCategory, AiReliabilityResponse } from '../types';

function catStyle(c: AiReliabilityCategory): { label: string; bar: string } {
  if (c === 'high') return { label: 'High', bar: 'bg-emerald-500' };
  if (c === 'medium') return { label: 'Medium', bar: 'bg-amber-500' };
  return { label: 'Low', bar: 'bg-red-500' };
}

type Props = {
  data: AiReliabilityResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
};

export function AiInsightCard({ data, isLoading, error, onRetry }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-violet-50/50 py-4 text-violet-800">
        <Loader2 className="h-5 w-5 animate-spin shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading AI insight…</span>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        AI insight unavailable.
        {onRetry ? (
          <button type="button" className="ml-2 font-bold underline" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  const pct = Math.round(data.ai_score * 100);
  const s = catStyle(data.category);

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700">AI insight</span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
            data.source === 'ai' ? 'bg-violet-200 text-violet-900' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {data.source === 'ai' ? 'AI service' : 'Rule fallback'}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-black text-slate-900 tabular-nums">{pct}%</span>
        <span className="mb-0.5 text-xs font-bold text-slate-500">predicted reliability</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className={`h-2 flex-1 rounded-full ${s.bar} opacity-90`} />
        <span className="text-[10px] font-bold uppercase text-slate-600">{s.label}</span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Uses the optional Python AI service when reachable; otherwise matches the rule engine so nothing breaks.
      </p>
    </div>
  );
}
