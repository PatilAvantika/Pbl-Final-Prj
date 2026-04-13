'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api/client';
import { useAuth } from '../../../context/AuthContext';
import { hasPermission } from '../../../lib/permissions';

export default function AdminAuditPage() {
    const { user } = useAuth();
    const canViewAudit = hasPermission(user?.role, 'viewAudit');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [entityTypeFilter, setEntityTypeFilter] = useState('');
    const [actorIdFilter, setActorIdFilter] = useState('');

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['admin-audit-logs', actionFilter, entityTypeFilter, actorIdFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '200' });
            if (actionFilter !== 'ALL') params.set('action', actionFilter);
            if (entityTypeFilter.trim()) params.set('entityType', entityTypeFilter.trim());
            if (actorIdFilter.trim()) params.set('actorId', actorIdFilter.trim());
            return (await api.get(`/audit/logs?${params.toString()}`)).data;
        },
    });

    if (!canViewAudit) {
        return <div className="text-sm font-semibold text-red-600">You do not have permission to view audit logs.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Audit & Compliance</h1>
                <p className="text-slate-500 font-medium">Track critical admin actions with actor and entity context.</p>
                </div>
                <button
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (actionFilter !== 'ALL') params.set('action', actionFilter);
                        if (entityTypeFilter.trim()) params.set('entityType', entityTypeFilter.trim());
                        if (actorIdFilter.trim()) params.set('actorId', actorIdFilter.trim());
                        const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
                        const baseUrl = raw.replace(/\/$/, '').endsWith('/api/v1')
                            ? raw.replace(/\/$/, '')
                            : `${raw.replace(/\/$/, '')}/api/v1`;
                        window.open(`${baseUrl}/audit/export.csv?${params.toString()}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm"
                >
                    Export CSV
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
                >
                    <option value="ALL">All Actions</option>
                    <option value="USER_CREATED">USER CREATED</option>
                    <option value="USER_UPDATED">USER UPDATED</option>
                    <option value="USER_DELETED">USER DELETED</option>
                    <option value="TASK_CREATED">TASK CREATED</option>
                    <option value="TASK_UPDATED">TASK UPDATED</option>
                    <option value="TASK_DELETED">TASK DELETED</option>
                    <option value="TASK_ASSIGNED">TASK ASSIGNED</option>
                    <option value="TASK_UNASSIGNED">TASK UNASSIGNED</option>
                    <option value="LEAVE_STATUS_UPDATED">LEAVE STATUS UPDATED</option>
                    <option value="REPORT_STATUS_UPDATED">REPORT STATUS UPDATED</option>
                    <option value="PAYSLIP_GENERATED">PAYSLIP GENERATED</option>
                </select>
                <input
                    value={entityTypeFilter}
                    onChange={(e) => setEntityTypeFilter(e.target.value)}
                    placeholder="Entity type (User, Task, FieldReport)"
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                />
                <input
                    value={actorIdFilter}
                    onChange={(e) => setActorIdFilter(e.target.value)}
                    placeholder="Actor ID"
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                />
            </div>

            {isLoading ? (
                <div className="h-40 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
                    <span className="animate-pulse font-bold text-slate-400">Loading audit logs...</span>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4 border-b border-slate-200">Timestamp</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Action</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Actor</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Entity</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Metadata</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                {logs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors align-top">
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-800 font-bold">{String(log.action).replaceAll('_', ' ')}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                                            <div className="text-xs text-slate-400">{log.actor?.email || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {log.entityType}
                                            <div className="text-xs text-slate-400 break-all">{log.entityId}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 break-all">
                                            {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                                            No audit logs found for selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
