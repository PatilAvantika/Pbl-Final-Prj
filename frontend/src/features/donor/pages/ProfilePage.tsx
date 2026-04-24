'use client';

import { Mail, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDonationHistory } from '../hooks/useDonorQueries';
import { useDonorProfileUi } from '../store/useDonorProfileUi';
import { formatCurrency, formatDate } from '../lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Switch } from '@/features/team-leader/components/ui/switch';
import { Label } from '@/features/team-leader/components/ui/label';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import { Button } from '@/features/team-leader/components/ui/button';
import { Separator } from '@/features/team-leader/components/ui/separator';
import { motion } from 'framer-motion';

export function DonorProfilePage() {
    const { user } = useAuth();
    const { data, isLoading, isError, error, refetch } = useDonationHistory();
    const { emailInsights, compactCards, setEmailInsights, setCompactCards } = useDonorProfileUi();

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-slate-200/80 bg-gradient-to-br from-white to-amber-50/40">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Donor profile</CardTitle>
                        <CardDescription>How we recognize you in the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                                <User className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xl font-extrabold text-slate-900">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                                    <Mail className="h-4 w-4" />
                                    {user?.email}
                                </p>
                                <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700">
                                    Donor
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <Card className="border-slate-200/80">
                <CardHeader>
                    <CardTitle className="text-slate-900">Settings</CardTitle>
                    <CardDescription>Preferences stay on this device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                        <div>
                            <Label htmlFor="insights" className="text-sm font-bold text-slate-800">
                                Impact email digests
                            </Label>
                            <p className="text-xs font-medium text-slate-500">UI preference — connect to notifications when available</p>
                        </div>
                        <Switch id="insights" checked={emailInsights} onCheckedChange={setEmailInsights} />
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                        <div>
                            <Label htmlFor="compact" className="text-sm font-bold text-slate-800">
                                Compact donation list
                            </Label>
                            <p className="text-xs font-medium text-slate-500">Tighter rows in history below</p>
                        </div>
                        <Switch id="compact" checked={compactCards} onCheckedChange={setCompactCards} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200/80">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-slate-900">Donation history</CardTitle>
                        <CardDescription>Recent contributions to campaigns</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void refetch()}>
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : isError ? (
                        <p className="text-center text-sm font-medium text-red-600">
                            {error instanceof Error ? error.message : 'Failed to load history'}
                        </p>
                    ) : !data?.length ? (
                        <p className="text-center text-sm font-medium text-slate-500">No donations recorded yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {data.map((row) => (
                                <li
                                    key={row.id}
                                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-4 ${
                                        compactCards ? 'py-2' : 'py-3'
                                    } shadow-sm`}
                                >
                                    <div>
                                        <p className="font-bold text-slate-900">{row.campaign.title}</p>
                                        <p className="text-xs font-medium text-slate-500">{row.campaign.zoneName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-extrabold text-amber-800">
                                            {formatCurrency(row.amount, row.currency)}
                                        </p>
                                        <p className="text-xs text-slate-500">{formatDate(row.createdAt)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Separator className="bg-slate-200" />
            <p className="text-center text-xs font-medium text-slate-500">
                Thank you for backing transparent field operations.
            </p>
        </div>
    );
}
