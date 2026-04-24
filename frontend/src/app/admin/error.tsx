'use client';

import { useEffect } from 'react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin route error', { message: error.message, digest: error.digest });
    }, [error]);

    return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-8">
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-5 text-center">
                We logged this failure. Please retry, or contact support if it keeps happening.
            </p>
            <button
                onClick={reset}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900"
            >
                Try Again
            </button>
        </div>
    );
}
