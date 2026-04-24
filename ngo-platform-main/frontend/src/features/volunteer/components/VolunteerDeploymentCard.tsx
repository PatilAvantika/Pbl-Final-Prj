'use client';

import Link from 'next/link';
import { Camera, Clock, Loader2, MapPin } from 'lucide-react';
import type { VolunteerActiveTask } from '../services/volunteer-api';
import {
    formatTaskTimeWindow,
    formatTemplateLabel,
    lifecycleStatusBadge,
} from '../lib/format-task-window';

export type VolunteerDeploymentCardProps = {
    task: VolunteerActiveTask;
    lastTodayType: 'CLOCK_IN' | 'CLOCK_OUT' | null;
    clockBusy: boolean;
    anyClockBusy: boolean;
    onClock: (taskId: string, kind: 'in' | 'out') => void;
};

export function VolunteerDeploymentCard({
    task,
    lastTodayType,
    clockBusy,
    anyClockBusy,
    onClock,
}: VolunteerDeploymentCardProps) {
    const isIn = lastTodayType === 'CLOCK_IN';
    const isDone = lastTodayType === 'CLOCK_OUT';
    const badge = lifecycleStatusBadge(task.lifecycleStatus);
    const timeRange = formatTaskTimeWindow(task.startTime, task.endTime);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                {formatTemplateLabel(task.template)}
                            </span>
                            <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${badge.className}`}
                            >
                                {badge.label}
                            </span>
                        </div>
                        <Link href={`/volunteer/task/${task.id}`}>
                            <h3 className="font-bold text-slate-800 text-[15px] leading-tight hover:text-emerald-700 transition-colors">
                                {task.title}
                            </h3>
                        </Link>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden />
                            {task.zoneName}
                        </p>
                        <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden />
                            <span className="tabular-nums">{timeRange}</span>
                        </p>
                    </div>
                    {isDone ? (
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100 flex-shrink-0">
                            Shift done
                        </span>
                    ) : isIn ? (
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" aria-hidden />
                            Clocked in
                        </span>
                    ) : null}
                </div>

                <div className="flex gap-2">
                    {!isDone && (
                        <button
                            type="button"
                            onClick={() => onClock(task.id, isIn ? 'out' : 'in')}
                            disabled={clockBusy || anyClockBusy}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 ${
                                isIn ? 'bg-amber-500 text-white' : 'bg-[#388E3C] text-white'
                            }`}
                        >
                            {clockBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-label="Working" />
                            ) : (
                                <>
                                    <Clock className="w-4 h-4" aria-hidden />
                                    {isIn ? 'Clock Out' : 'Clock In'}
                                </>
                            )}
                        </button>
                    )}
                    <Link
                        href={`/volunteer/task/${task.id}/camera`}
                        className="px-4 py-3 rounded-xl border-2 border-emerald-200 text-emerald-700 font-bold text-sm flex items-center gap-1.5 bg-emerald-50/60 active:scale-[0.97] transition-transform"
                    >
                        <Camera className="w-4 h-4" aria-hidden />
                        {isDone ? 'Report' : 'Photo'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
