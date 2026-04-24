'use client';

import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 px-8 py-16 text-center"
        >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Icon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">{description}</p>
        </motion.div>
    );
}
