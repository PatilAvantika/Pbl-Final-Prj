import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResourceItem } from '@/features/team-leader/types/team-leader';

const defaultInventory: ResourceItem[] = [
    { id: 'gloves', name: 'Gloves (pairs)', unit: 'pairs', quantity: 120 },
    { id: 'bags', name: 'Waste bags', unit: 'bags', quantity: 400 },
    { id: 'tools', name: 'Collection tools', unit: 'kits', quantity: 18 },
];

interface ResourceState {
    inventory: ResourceItem[];
    allocations: Record<string, Record<string, number>>;
    setQuantity: (resourceId: string, quantity: number) => void;
    allocateToTask: (taskId: string, resourceId: string, amount: number) => void;
    resetDefaults: () => void;
}

export const useTeamLeaderResourceStore = create<ResourceState>()(
    persist(
        (set, get) => ({
            inventory: defaultInventory,
            allocations: {},
            setQuantity: (resourceId, quantity) =>
                set((s) => ({
                    inventory: s.inventory.map((r) =>
                        r.id === resourceId ? { ...r, quantity: Math.max(0, quantity) } : r
                    ),
                })),
            allocateToTask: (taskId, resourceId, amount) => {
                const inv = get().inventory.find((r) => r.id === resourceId);
                if (!inv || amount < 0) return;
                set((s) => {
                    const prevAlloc = s.allocations[taskId]?.[resourceId] ?? 0;
                    const delta = amount - prevAlloc;
                    if (inv.quantity - delta < 0) return s;
                    const nextInv = s.inventory.map((r) =>
                        r.id === resourceId ? { ...r, quantity: r.quantity - delta } : r
                    );
                    const taskAlloc = { ...(s.allocations[taskId] ?? {}), [resourceId]: amount };
                    return {
                        inventory: nextInv,
                        allocations: { ...s.allocations, [taskId]: taskAlloc },
                    };
                });
            },
            resetDefaults: () => set({ inventory: defaultInventory, allocations: {} }),
        }),
        { name: 'team-leader-resources' }
    )
);
