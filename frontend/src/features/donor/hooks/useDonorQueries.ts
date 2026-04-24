import { useQuery } from '@tanstack/react-query';
import {
    fetchDonationHistory,
    fetchDonorAnalytics,
    fetchDonorCampaigns,
    fetchDonorDashboard,
    fetchDonorReports,
} from '../services/donor-api';

export function useDonorDashboard() {
    return useQuery({
        queryKey: ['donor', 'dashboard'],
        queryFn: fetchDonorDashboard,
    });
}

export function useDonorCampaigns(filters: {
    from?: string;
    to?: string;
    location?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: ['donor', 'campaigns', filters],
        queryFn: () => fetchDonorCampaigns(filters),
    });
}

export function useDonorReports(params: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: ['donor', 'reports', params.page ?? 1, params.limit ?? 20],
        queryFn: () => fetchDonorReports(params),
    });
}

export function useDonorAnalytics() {
    return useQuery({
        queryKey: ['donor', 'analytics'],
        queryFn: fetchDonorAnalytics,
    });
}

export function useDonationHistory() {
    return useQuery({
        queryKey: ['donor', 'donation-history'],
        queryFn: fetchDonationHistory,
    });
}
