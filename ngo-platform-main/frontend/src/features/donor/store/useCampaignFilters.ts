import { create } from 'zustand';

type CampaignFilters = {
    from: string;
    to: string;
    location: string;
    status: string;
    setFrom: (v: string) => void;
    setTo: (v: string) => void;
    setLocation: (v: string) => void;
    setStatus: (v: string) => void;
    reset: () => void;
};

const initial = { from: '', to: '', location: '', status: '' };

export const useCampaignFilters = create<CampaignFilters>((set) => ({
    ...initial,
    setFrom: (from) => set({ from }),
    setTo: (to) => set({ to }),
    setLocation: (location) => set({ location }),
    setStatus: (status) => set({ status }),
    reset: () => set(initial),
}));
