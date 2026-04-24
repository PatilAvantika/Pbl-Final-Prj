import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
    emailInsights: boolean;
    compactCards: boolean;
    setEmailInsights: (v: boolean) => void;
    setCompactCards: (v: boolean) => void;
};

export const useDonorProfileUi = create<State>()(
    persist(
        (set) => ({
            emailInsights: true,
            compactCards: false,
            setEmailInsights: (emailInsights) => set({ emailInsights }),
            setCompactCards: (compactCards) => set({ compactCards }),
        }),
        { name: 'donor-profile-ui' },
    ),
);
