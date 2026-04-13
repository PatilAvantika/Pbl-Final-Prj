'use client';

import { ReactNode, useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthSessionGate } from '@/components/AuthSessionGate';

export function ClientProviders({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AuthSessionGate>{children}</AuthSessionGate>
                <Toaster richColors position="top-center" closeButton />
            </AuthProvider>
        </QueryClientProvider>
    );
}
