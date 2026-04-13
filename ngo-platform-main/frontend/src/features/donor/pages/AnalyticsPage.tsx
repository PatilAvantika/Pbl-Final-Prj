'use client';

import { BarChart3 } from 'lucide-react';
import { useDonorAnalytics } from '../hooks/useDonorQueries';
import {
    ActivityHeatmapCard,
    WasteTrendAnalyticsCard,
    VolunteerParticipationCard,
    CampaignSuccessCard,
} from '../components/DonorAnalyticsCharts';
import { ChartSkeleton } from '../components/DonorSkeletons';
import { EmptyState } from '../components/EmptyState';
import { Button } from '@/features/team-leader/components/ui/button';

export function DonorAnalyticsPage() {
    const { data, isLoading, isError, error, refetch } = useDonorAnalytics();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    <ChartSkeleton className="lg:col-span-2" />
                    <ChartSkeleton />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50/80 p-8 text-center">
                <p className="font-bold text-red-800">Could not load analytics</p>
                <p className="mt-2 text-sm text-red-700">{error instanceof Error ? error.message : 'Please try again.'}</p>
                <Button type="button" className="mt-4 rounded-xl" onClick={() => void refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    const empty =
        data.fundedCampaignsTotal === 0 &&
        data.heatmapBuckets.length === 0 &&
        data.wasteTrend.length === 0 &&
        data.volunteerParticipation.length === 0;

    return (
        <div className="space-y-8">
            {empty ? (
                <EmptyState
                    icon={BarChart3}
                    title="Analytics will appear here"
                    description="Fund a campaign to unlock location heatmaps, waste trends, volunteer participation, and completion rates."
                />
            ) : null}

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <ActivityHeatmapCard heatmapBuckets={data.heatmapBuckets} />
                </div>
                <CampaignSuccessCard rate={data.campaignSuccessRate} total={data.fundedCampaignsTotal} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <WasteTrendAnalyticsCard wasteTrend={data.wasteTrend} />
                <VolunteerParticipationCard volunteerParticipation={data.volunteerParticipation} />
            </div>
        </div>
    );
}
