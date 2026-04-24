'use client';

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import type { DonorAnalytics } from '../types';

function formatMonthLabel(key: string) {
    const [y, m] = key.split('-');
    if (!y || !m) return key;
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function ActivityHeatmapCard({ heatmapBuckets }: { heatmapBuckets: DonorAnalytics['heatmapBuckets'] }) {
    const data = [...heatmapBuckets]
        .sort((a, b) => b.reportCount - a.reportCount)
        .slice(0, 18)
        .map((b) => ({
            name: b.label,
            count: b.reportCount,
            density: b.density,
        }));

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-slate-200/80">
                <CardHeader>
                    <CardTitle className="text-slate-900">Impact density by area</CardTitle>
                    <CardDescription>
                        Aggregated geo buckets from verified reports linked to your funded campaigns (bar height = report count;
                        color = relative density).
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] w-full">
                    {data.length === 0 ? (
                        <p className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                            No geo buckets yet for linked reports.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 9, fill: '#64748b' }}
                                    interval={0}
                                    angle={-35}
                                    textAnchor="end"
                                    height={56}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                                <Tooltip
                                    formatter={(v: number) => [v, 'Reports']}
                                    labelFormatter={(label) => `Bucket ${label}`}
                                />
                                <Bar dataKey="count" name="Reports" radius={[6, 6, 0, 0]}>
                                    {data.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={`rgba(217, 119, 6, ${0.35 + Math.min(1, entry.density) * 0.6})`}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function WasteTrendAnalyticsCard({ wasteTrend }: { wasteTrend: DonorAnalytics['wasteTrend'] }) {
    const chartData = wasteTrend.map((d) => ({ ...d, label: formatMonthLabel(d.month) }));

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-slate-200/80">
                <CardHeader>
                    <CardTitle className="text-slate-900">Waste collection trend</CardTitle>
                    <CardDescription>From verified reports linked to your funded campaigns</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] w-full">
                    {chartData.length === 0 ? (
                        <p className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                            No waste metrics recorded yet.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="bags" name="Units" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

const BAR_COLORS = ['#d97706', '#b45309', '#0d9488', '#6366f1', '#64748b'];

export function VolunteerParticipationCard({
    volunteerParticipation,
}: {
    volunteerParticipation: DonorAnalytics['volunteerParticipation'];
}) {
    const data = volunteerParticipation.map((v, i) => ({
        ...v,
        label: `V${i + 1}`,
    }));

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-200/80">
                <CardHeader>
                    <CardTitle className="text-slate-900">Volunteer participation</CardTitle>
                    <CardDescription>Check-in sessions on funded field tasks (anonymized)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] w-full">
                    {data.length === 0 ? (
                        <p className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                            No attendance linked yet.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip
                                    formatter={(v: number) => [v, 'Sessions']}
                                    labelFormatter={(_, payload) => {
                                        const row = payload?.[0]?.payload as { userId?: string } | undefined;
                                        return row?.userId ? `Volunteer ${row.userId.slice(0, 8)}…` : '';
                                    }}
                                />
                                <Bar dataKey="sessions" name="Sessions" radius={[6, 6, 0, 0]}>
                                    {data.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function CampaignSuccessCard({
    rate,
    total,
}: {
    rate: number;
    total: number;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="border-slate-200/80 bg-gradient-to-br from-white to-amber-50/50">
                <CardHeader>
                    <CardTitle className="text-slate-900">Campaign success rate</CardTitle>
                    <CardDescription>Share of your funded campaigns marked completed</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-extrabold tracking-tight text-amber-800">{rate}%</p>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                        Across <span className="font-bold text-slate-800">{total}</span> funded campaigns
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
