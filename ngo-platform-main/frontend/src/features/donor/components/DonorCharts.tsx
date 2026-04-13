'use client';

import {
    Line,
    LineChart,
    Pie,
    PieChart,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';

const PIE_COLORS = ['#d97706', '#0d9488', '#6366f1', '#e11d48', '#64748b', '#16a34a'];

function formatMonthLabel(key: string) {
    const [y, m] = key.split('-');
    if (!y || !m) return key;
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function DonationTrendChart({ data }: { data: { month: string; amount: number }[] }) {
    const chartData = data.map((d) => ({ ...d, label: formatMonthLabel(d.month) }));

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-200/80">
                <CardHeader>
                    <CardTitle className="text-slate-900">Donation trend</CardTitle>
                    <CardDescription>Your contributions over recent months</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] w-full min-h-[220px]">
                    {chartData.length === 0 ? (
                        <p className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                            No donation data in this window yet.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 12,
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    name="Amount"
                                    stroke="#d97706"
                                    strokeWidth={2.5}
                                    dot={{ r: 3, fill: '#b45309' }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function ImpactPieChart({ data }: { data: { name: string; value: number }[] }) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-slate-200/80">
                <CardHeader>
                    <CardTitle className="text-slate-900">Impact distribution</CardTitle>
                    <CardDescription>Field programs tied to your funded campaigns</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] w-full min-h-[220px]">
                    {data.length === 0 ? (
                        <p className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                            Impact mix will appear once campaigns link to program types.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={56}
                                    outerRadius={88}
                                    paddingAngle={2}
                                >
                                    {data.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
