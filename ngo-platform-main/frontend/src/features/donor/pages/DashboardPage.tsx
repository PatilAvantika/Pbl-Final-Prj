'use client';

import Link from 'next/link';
import { IndianRupee, Megaphone, Recycle, Clock, ChevronRight, FileText } from 'lucide-react';
import { useDonorDashboard } from '../hooks/useDonorQueries';
import { DonorKpiCard } from '../components/DonorKpiCard';
import { DonationTrendChart, ImpactPieChart } from '../components/DonorCharts';
import { KpiGridSkeleton, ChartSkeleton, ListSkeleton } from '../components/DonorSkeletons';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Button } from '@/features/team-leader/components/ui/button';
import { motion } from 'framer-motion';

export function DonorDashboardPage() {
    const { data, isLoading, isError, error, refetch } = useDonorDashboard();

    if (isLoading) {
        return (
            <div className="space-y-8">
                <KpiGridSkeleton />
                <div className="grid gap-6 lg:grid-cols-2">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
                <ListSkeleton rows={3} />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50/80 p-8 text-center">
                <p className="font-bold text-red-800">Could not load your dashboard</p>
                <p className="mt-2 text-sm text-red-700">{error instanceof Error ? error.message : 'Please try again.'}</p>
                <Button type="button" className="mt-4 rounded-xl" onClick={() => void refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    const { kpis, donationTrend, impactDistribution, recentCampaigns, recentReports } = data;
    const hasCampaigns = recentCampaigns.length > 0;
    const hasReports = recentReports.length > 0;

    return (
        <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DonorKpiCard
                    label="Total donations"
                    value={formatCurrency(kpis.totalDonations, kpis.currency)}
                    hint="Lifetime contributions"
                    icon={IndianRupee}
                    delay={0}
                />
                <DonorKpiCard
                    label="Campaigns supported"
                    value={String(kpis.campaignsSupported)}
                    hint="Distinct programs funded"
                    icon={Megaphone}
                    delay={0.05}
                />
                <DonorKpiCard
                    label="Waste collected"
                    value={String(kpis.wasteCollected)}
                    hint="Units from verified reports"
                    icon={Recycle}
                    delay={0.1}
                />
                <DonorKpiCard
                    label="Volunteer hours"
                    value={`~${kpis.volunteerHoursSupported}h`}
                    hint="Estimated from field check-ins"
                    icon={Clock}
                    delay={0.15}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <DonationTrendChart data={donationTrend} />
                <ImpactPieChart data={impactDistribution} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-slate-200/80">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-slate-900">Latest campaigns</CardTitle>
                            <Button variant="ghost" size="sm" className="rounded-xl text-amber-800" asChild>
                                <Link href="/donor/campaigns">
                                    View all
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!hasCampaigns ? (
                                <EmptyState
                                    icon={Megaphone}
                                    title="No campaigns yet"
                                    description="When you fund a campaign, it will appear here with live impact signals."
                                />
                            ) : (
                                recentCampaigns.map((c, i) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900">{c.title}</p>
                                            <p className="text-xs font-medium text-slate-500">{c.zoneName}</p>
                                            <span
                                                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                    c.status === 'ACTIVE'
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {c.status === 'ACTIVE' ? 'Active' : 'Completed'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-extrabold text-amber-800">
                                                {formatCurrency(c.contributed, kpis.currency)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                    <Card className="border-slate-200/80">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-slate-900">Recent reports</CardTitle>
                            <Button variant="ghost" size="sm" className="rounded-xl text-amber-800" asChild>
                                <Link href="/donor/reports">
                                    View all
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!hasReports ? (
                                <EmptyState
                                    icon={FileText}
                                    title="No verified reports yet"
                                    description="Approved field reports from your funded tasks will surface here."
                                />
                            ) : (
                                recentReports.map((r) => (
                                    <div
                                        key={r.id}
                                        className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                                    >
                                        <p className="font-bold text-slate-900">{r.taskTitle}</p>
                                        <p className="text-xs font-medium text-slate-500">{r.zoneName}</p>
                                        <p className="mt-2 text-xs text-slate-600">
                                            {formatDate(r.timestamp)} · {r.volunteerName}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            Waste: {r.quantityItems ?? '—'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
