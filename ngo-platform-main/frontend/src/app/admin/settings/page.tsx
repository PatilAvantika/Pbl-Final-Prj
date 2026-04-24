'use client';

import { useAuth } from '../../../context/AuthContext';
import { Settings, User, Shield, Bell } from 'lucide-react';

export default function AdminSettingsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Settings</h2>
                    <p className="text-slate-500 font-medium">Manage your account and platform preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-emerald-600" />
                        Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard label="First name" value={user?.firstName || 'N/A'} />
                        <InfoCard label="Last name" value={user?.lastName || 'N/A'} />
                        <InfoCard label="Email" value={user?.email || 'N/A'} />
                        <InfoCard label="Role" value={user?.role?.replaceAll('_', ' ') || 'N/A'} />
                    </div>
                </section>

                <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-800 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-sky-600" />
                        Security
                    </h3>
                    <p className="text-sm text-slate-600">
                        Password and advanced security controls can be configured from backend workflows.
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                        Coming soon: password reset and MFA setup.
                    </div>
                </section>
            </div>

            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-indigo-600" />
                    Notifications
                </h3>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">
                        System-wide notification preferences will appear here.
                    </p>
                </div>
            </section>
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 break-words">{value}</p>
        </div>
    );
}
