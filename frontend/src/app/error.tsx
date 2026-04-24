'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[app error]', error);
    }, [error]);

    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-600 mb-6 max-w-md">
                An unexpected error occurred. You can try again or return home.
            </p>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                    Try again
                </button>
                <Link href="/" className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700">
                    Home
                </Link>
            </div>
        </div>
    );
}
