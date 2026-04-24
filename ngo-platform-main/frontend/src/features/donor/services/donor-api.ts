import api from '@/lib/api/client';
import type {
    DonorAnalytics,
    DonorCampaignRow,
    DonationHistoryRow,
    DonorDashboard,
    DonorReportRow,
    Paginated,
} from '../types';

function assertPaginated<T>(raw: unknown): Paginated<T> {
    if (
        raw === null ||
        typeof raw !== 'object' ||
        !Array.isArray((raw as Paginated<T>).data) ||
        typeof (raw as Paginated<T>).total !== 'number' ||
        typeof (raw as Paginated<T>).page !== 'number' ||
        typeof (raw as Paginated<T>).limit !== 'number' ||
        typeof (raw as Paginated<T>).hasNext !== 'boolean'
    ) {
        throw new Error('Unexpected donor list response from server');
    }
    return raw as Paginated<T>;
}

export async function fetchDonorDashboard(): Promise<DonorDashboard> {
    const { data } = await api.get<DonorDashboard>('/donor/dashboard');
    return data;
}

export async function fetchDonorCampaigns(params: {
    from?: string;
    to?: string;
    location?: string;
    status?: string;
    page?: number;
    limit?: number;
}): Promise<Paginated<DonorCampaignRow>> {
    const { data } = await api.get<unknown>('/donor/campaigns', { params });
    return assertPaginated<DonorCampaignRow>(data);
}

export async function fetchDonorReports(params: { page?: number; limit?: number }): Promise<Paginated<DonorReportRow>> {
    const { data } = await api.get<unknown>('/donor/reports', { params });
    return assertPaginated<DonorReportRow>(data);
}

export async function fetchDonorAnalytics(): Promise<DonorAnalytics> {
    const { data } = await api.get<DonorAnalytics>('/donor/analytics');
    if (!data || !Array.isArray(data.heatmapBuckets)) {
        throw new Error('Unexpected donor analytics response from server');
    }
    return data;
}

export async function fetchDonationHistory(): Promise<DonationHistoryRow[]> {
    const { data } = await api.get<DonationHistoryRow[]>('/donor/donation-history');
    return data;
}

/** Server-only PDF (APPROVED + donor campaign access); 404 otherwise. */
export async function downloadDonorReportPdf(reportId: string): Promise<void> {
    const { data } = await api.get<Blob>(`/donor/report/${reportId}/pdf`, {
        responseType: 'blob',
    });
    const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-report-${reportId}.pdf`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}
