'use client';

import { X } from 'lucide-react';
import type { VolunteerLeave } from '../services/volunteer-api';

const LEAVE_TYPE_LABELS: Record<string, string> = {
    CASUAL: 'Casual',
    SICK: 'Sick',
    EARNED: 'Earned',
    HALF_DAY: 'Half day',
    UNPAID: 'Unpaid',
    COMP_OFF: 'Comp off',
};

type LeaveCardProps = {
    leave: VolunteerLeave;
    onCancel?: (id: string) => void;
    cancelBusy?: boolean;
};

export function LeaveCard({ leave, onCancel, cancelBusy }: LeaveCardProps) {
    const statusStyles =
        leave.status === 'APPROVED'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : leave.status === 'REJECTED'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-amber-50 text-amber-800 border-amber-200';

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    return (
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                            {LEAVE_TYPE_LABELS[leave.type] ?? leave.type}
                        </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                        {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' — '}
                        {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {leave.reason ? (
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{leave.reason}</p>
                    ) : null}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${statusStyles}`}
                    >
                        {leave.status === 'PENDING' ? 'Pending' : leave.status}
                    </span>
                    {leave.status === 'PENDING' && onCancel ? (
                        <button
                            type="button"
                            disabled={cancelBusy}
                            onClick={() => onCancel(leave.id)}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Cancel request"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
