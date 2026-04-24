'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';

export function DonorKpiCard({
    label,
    value,
    hint,
    icon: Icon,
    delay = 0,
}: {
    label: string;
    value: string;
    hint?: string;
    icon: LucideIcon;
    delay?: number;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
            <Card className="border-slate-200/80 bg-gradient-to-br from-white to-amber-50/40 shadow-sm shadow-amber-900/5">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</CardTitle>
                    <div className="rounded-xl bg-amber-100 p-2 text-amber-800">
                        <Icon className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
                    {hint ? <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p> : null}
                </CardContent>
            </Card>
        </motion.div>
    );
}
