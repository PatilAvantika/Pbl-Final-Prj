export type DonorDashboard = {
    kpis: {
        totalDonations: number;
        campaignsSupported: number;
        wasteCollected: number;
        volunteerHoursSupported: number;
        currency: string;
    };
    donationTrend: { month: string; amount: number }[];
    impactDistribution: { name: string; value: number }[];
    recentCampaigns: {
        id: string;
        title: string;
        zoneName: string;
        status: string;
        lat: number;
        lng: number;
        contributed: number;
        template?: string;
    }[];
    recentReports: {
        id: string;
        taskTitle: string;
        zoneName: string;
        quantityItems: number | null;
        timestamp: string;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        volunteerName: string;
    }[];
};

export type Paginated<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
};

export type DonorCampaignRow = {
    id: string;
    title: string;
    description?: string | null;
    zoneName: string;
    lat: number;
    lng: number;
    startDate?: string;
    endDate?: string;
    status: string;
    contributed: number;
    currency: string;
    taskId: string | null;
    template?: string;
    impact: {
        wasteBagsEstimate: number | null;
        treesEstimate: number | null;
        verifiedWasteTotal?: number | null;
        approvedReportCount?: number | null;
    };
};

export type DonorReportRow = {
    id: string;
    taskId: string;
    userId: string;
    beforePhotoUrl: string | null;
    afterPhotoUrl: string | null;
    quantityItems: number | null;
    notes: string | null;
    timestamp: string;
    status: string;
    task: { title: string; zoneName: string; geofenceLat: number; geofenceLng: number };
    user: { firstName: string; lastName: string };
    approvedBy: { firstName: string; lastName: string } | null;
};

export type DonorHeatmapBucket = {
    bucketLat: number;
    bucketLng: number;
    reportCount: number;
    density: number;
    label: string;
};

export type DonorAnalytics = {
    heatmapBuckets: DonorHeatmapBucket[];
    wasteTrend: { month: string; bags: number }[];
    volunteerParticipation: { userId: string; sessions: number }[];
    campaignSuccessRate: number;
    fundedCampaignsTotal: number;
    campaignPerformance?: {
        campaignId: string;
        title: string;
        status: string;
        verifiedWasteTotal: number;
        approvedReportCount: number;
        isComplete: boolean;
    }[];
};

export type DonationHistoryRow = {
    id: string;
    amount: number;
    currency: string;
    createdAt: string;
    campaign: { id: string; title: string; zoneName: string };
};
