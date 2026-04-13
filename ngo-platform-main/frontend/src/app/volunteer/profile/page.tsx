'use client';

import { useState } from 'react';
import {
    Calendar,
    LogOut,
    Briefcase,
    Mail,
    ClipboardList,
    Clock,
    Star,
    UserCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useProfile } from '@/features/volunteer/hooks/useProfile';
import { useLeaveSummary } from '@/features/volunteer/hooks/useLeaveSummary';
import { useLeaves } from '@/features/volunteer/hooks/useLeaves';
import { useDashboardStats } from '@/features/volunteer/hooks/useDashboardStats';
import { useCancelVolunteerLeave } from '@/features/volunteer/hooks/useVolunteerLeaveMutations';
import { LeaveCard } from '@/features/volunteer/components/LeaveCard';
import { LeaveRequestModal } from '@/features/volunteer/components/LeaveRequestModal';
import { toast } from 'sonner';

function ProfileHeroSkeleton() {
    return (
        <div className="relative z-10 flex flex-col items-center animate-pulse">
            <div className="w-20 h-20 rounded-2xl bg-white/20 mb-3" />
            <div className="h-6 w-40 bg-white/20 rounded-lg mb-2" />
            <div className="h-4 w-48 bg-white/15 rounded mb-2" />
            <div className="h-6 w-24 bg-white/15 rounded-full" />
        </div>
    );
}

function StatsStripSkeleton() {
    return (
        <div className="mt-6 grid grid-cols-3 gap-2 relative z-10 animate-pulse">
            {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-3 h-24 border border-white/10" />
            ))}
        </div>
    );
}

function LeaveSummarySkeleton() {
    return (
        <div className="grid grid-cols-3 gap-3 animate-pulse">
            {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-3.5 border border-slate-100 h-20" />
            ))}
        </div>
    );
}

function LeaveListSkeleton() {
    return (
        <div className="space-y-2.5 animate-pulse">
            {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl h-24" />
            ))}
        </div>
    );
}

export default function MobileProfile() {
    const { user, logout } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [leaveModalKey, setLeaveModalKey] = useState(0);

    const openLeaveModal = () => {
        setLeaveModalKey((k) => k + 1);
        setModalOpen(true);
    };

    const profileQuery = useProfile();
    const leaveSummaryQuery = useLeaveSummary();
    const leavesQuery = useLeaves();
    const dashQuery = useDashboardStats();
    const cancelMutation = useCancelVolunteerLeave();

    const profile = profileQuery.data;
    const displayFirst = profile?.firstName ?? user?.firstName ?? '';
    const displayLast = profile?.lastName ?? user?.lastName ?? '';
    const displayEmail = profile?.email ?? user?.email ?? '';
    const displayRole = profile?.role ?? user?.role ?? '';

    const dash = dashQuery.data;
    const summary = leaveSummaryQuery.data;

    const handleCancelLeave = (leaveId: string) => {
        if (!confirm('Cancel this leave request?')) return;
        cancelMutation.mutate(leaveId, {
            onSuccess: () => toast.success('Leave request cancelled'),
            onError: () => toast.error('Could not cancel leave request'),
        });
    };

    const leavesError = leavesQuery.isError;
    const summaryError = leaveSummaryQuery.isError;

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-24">
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/[0.04] rounded-full pointer-events-none" />
                <div className="absolute top-20 -left-8 w-32 h-32 bg-emerald-400/10 rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    {profileQuery.isPending && !profileQuery.isError ? (
                        <ProfileHeroSkeleton />
                    ) : profileQuery.isError ? (
                        <>
                            <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/20 text-3xl font-black flex items-center justify-center shadow-inner mb-3 select-none">
                                {user?.firstName?.[0]}
                                {user?.lastName?.[0]}
                            </div>
                            <h1 className="text-xl font-extrabold tracking-tight">
                                {user?.firstName} {user?.lastName}
                            </h1>
                            <p className="text-emerald-200/90 text-xs mt-2 text-center px-4">
                                Profile could not be loaded. Showing account session details.
                            </p>
                            <p className="text-emerald-300 text-sm mt-1 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                {user?.email}
                            </p>
                            <div className="bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2.5 flex items-center gap-1.5">
                                <Briefcase className="w-3 h-3" />
                                {user?.role?.replace(/_/g, ' ')}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/20 text-3xl font-black flex items-center justify-center shadow-inner mb-3 select-none">
                                {displayFirst?.[0]}
                                {displayLast?.[0]}
                            </div>
                            <h1 className="text-xl font-extrabold tracking-tight">
                                {displayFirst} {displayLast}
                            </h1>
                            <p className="text-emerald-300 text-sm mt-0.5 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                {displayEmail}
                            </p>
                            <div className="bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2.5 flex items-center gap-1.5">
                                <Briefcase className="w-3 h-3" />
                                {String(displayRole).replace(/_/g, ' ')}
                            </div>
                        </>
                    )}
                </div>

                {dashQuery.isPending ? (
                    <StatsStripSkeleton />
                ) : dashQuery.isError ? (
                    <p className="mt-6 text-center text-emerald-200/80 text-xs font-medium relative z-10">
                        Activity stats unavailable
                    </p>
                ) : dash ? (
                    <div className="mt-6 grid grid-cols-3 gap-2 relative z-10">
                        {[
                            { label: 'Days', value: dash.activeDays, icon: Calendar },
                            { label: 'Hours', value: `${dash.totalHours}h`, icon: Clock },
                            { label: 'Streak', value: `${dash.streakDays}d`, icon: Star },
                        ].map(({ label, value, icon: Icon }) => (
                            <div
                                key={label}
                                className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm border border-white/10"
                            >
                                <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
                                <p className="text-lg font-extrabold leading-tight tabular-nums">{value}</p>
                                <p className="text-[8px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="px-4 mt-5 space-y-5">
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={openLeaveModal}
                        className="flex-1 py-3 rounded-2xl font-bold shadow-sm transition-colors text-sm flex items-center justify-center gap-2 bg-[#388E3C] text-white hover:bg-[#2E7D32]"
                    >
                        <Calendar className="w-4 h-4" />
                        Request leave
                    </button>
                    <button
                        type="button"
                        onClick={logout}
                        className="w-14 bg-white text-red-500 border border-red-100 flex items-center justify-center rounded-2xl shadow-sm hover:bg-red-50 transition-colors"
                        aria-label="Log out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {leaveSummaryQuery.isPending ? (
                    <LeaveSummarySkeleton />
                ) : summaryError ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-900 font-medium">
                        Leave summary could not be loaded.
                    </div>
                ) : summary ? (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Pending', value: summary.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Approved', value: summary.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Total', value: summary.total, color: 'text-blue-600', bg: 'bg-blue-50' },
                        ].map(({ label, value, color, bg }) => (
                            <div
                                key={label}
                                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center"
                            >
                                <div className={`text-xl font-extrabold tabular-nums ${color}`}>{value}</div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : null}

                <section>
                    <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                        Leave history
                    </h2>

                    {leavesQuery.isPending ? (
                        <LeaveListSkeleton />
                    ) : leavesError ? (
                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-red-100">
                            <UserCircle className="w-10 h-10 text-red-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-800">Could not load leave history</p>
                            <p className="text-xs text-slate-500 mt-1">Pull to retry or open the page again.</p>
                        </div>
                    ) : !leavesQuery.data?.length ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Calendar className="w-7 h-7 text-emerald-300" />
                            </div>
                            <p className="font-bold text-slate-700 mb-1">No leave requests</p>
                            <p className="text-xs text-slate-400 mb-5">Submit a request when you need time off</p>
                            <button
                                type="button"
                                onClick={openLeaveModal}
                                className="inline-flex items-center gap-2 bg-[#388E3C] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm"
                            >
                                <Calendar className="w-4 h-4" />
                                Request leave
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {leavesQuery.data.map((lv) => (
                                <LeaveCard
                                    key={lv.id}
                                    leave={lv}
                                    onCancel={handleCancelLeave}
                                    cancelBusy={cancelMutation.isPending}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <LeaveRequestModal
                key={leaveModalKey}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}
