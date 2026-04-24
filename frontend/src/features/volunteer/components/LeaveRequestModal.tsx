'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateVolunteerLeave } from '../hooks/useVolunteerLeaveMutations';

const LEAVE_TYPES: { value: string; label: string; emoji: string }[] = [
    { value: 'CASUAL', label: 'Casual', emoji: '🌴' },
    { value: 'SICK', label: 'Sick', emoji: '🤒' },
    { value: 'UNPAID', label: 'Unpaid', emoji: '💼' },
    { value: 'EARNED', label: 'Earned', emoji: '📅' },
];

type LeaveRequestModalProps = {
    open: boolean;
    onClose: () => void;
};

export function LeaveRequestModal({ open, onClose }: LeaveRequestModalProps) {
    const createMutation = useCreateVolunteerLeave();
    const [type, setType] = useState('CASUAL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [clientError, setClientError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setClientError(null);
        const r = reason.trim();
        if (!r) {
            setClientError('Please add a reason for your leave.');
            return;
        }
        if (!startDate || !endDate) {
            setClientError('Start and end dates are required.');
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end.getTime() < start.getTime()) {
            setClientError('End date must be on or after the start date.');
            return;
        }

        createMutation.mutate(
            { type, startDate, endDate, reason: r },
            {
                onSuccess: () => {
                    toast.success('Leave request submitted');
                    onClose();
                },
                onError: (err: unknown) => {
                    const ax = err as { response?: { data?: { message?: string | string[] } } };
                    const m = ax.response?.data?.message;
                    const msg = Array.isArray(m) ? m.join(', ') : m;
                    toast.error(msg || 'Could not submit leave request');
                },
            },
        );
    };

    return (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close"
                        className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !createMutation.isPending && onClose()}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="leave-modal-title"
                        className="fixed left-4 right-4 bottom-6 top-[12vh] max-h-[min(85vh,640px)] z-[1001] mx-auto max-w-md flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-900 text-white shrink-0">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-emerald-200" />
                                <h2 id="leave-modal-title" className="font-extrabold text-lg tracking-tight">
                                    Request leave
                                </h2>
                            </div>
                            <button
                                type="button"
                                disabled={createMutation.isPending}
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
                                    Leave type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {LEAVE_TYPES.map(({ value, label, emoji }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setType(value)}
                                            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border-2 ${
                                                type === value
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                                    : 'bg-slate-50 border-transparent text-slate-600'
                                            }`}
                                        >
                                            <span className="text-base">{emoji}</span>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
                                        Start date
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
                                        End date
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={endDate}
                                        min={startDate || undefined}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between pl-0.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        Reason
                                    </label>
                                    <span className="text-[9px] text-slate-400">{reason.length}/500</span>
                                </div>
                                <textarea
                                    required
                                    maxLength={500}
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Briefly explain why you need leave…"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
                                />
                            </div>

                            {(clientError || createMutation.isError) && (
                                <div className="flex items-start gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{clientError || 'Something went wrong. Try again.'}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full py-3.5 bg-[#388E3C] text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-transform"
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Submit request
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
