'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-extrabold text-slate-800">Access Denied</h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Your account does not have permission to access this portal.
                </p>
                <Link
                    href="/"
                    className="inline-block mt-6 px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900"
                >
                    Back to Landing
                </Link>
            </div>
        </div>
    );
}
