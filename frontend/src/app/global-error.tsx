'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                <p className="text-slate-600 mb-6 text-center max-w-md">
                    The application hit a critical error. Please refresh or try again later.
                </p>
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold"
                >
                    Try again
                </button>
                {process.env.NODE_ENV === 'development' && error?.message ? (
                    <pre className="mt-8 text-xs text-left max-w-lg overflow-auto bg-white p-4 rounded-xl border">
                        {error.message}
                    </pre>
                ) : null}
            </body>
        </html>
    );
}
