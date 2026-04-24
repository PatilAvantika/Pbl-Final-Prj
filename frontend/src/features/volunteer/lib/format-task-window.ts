const timeFmt: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
};

const dateTimeFmt: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
};

/** Local display of task start/end (ISO strings from API). */
export function formatTaskTimeWindow(startIso: string, endIso: string): string {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return '—';
    }
    const sameCalendarDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
    if (sameCalendarDay) {
        return `${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`;
    }
    return `${start.toLocaleString(undefined, dateTimeFmt)} – ${end.toLocaleString(undefined, dateTimeFmt)}`;
}

export function formatTemplateLabel(template: string): string {
    return template.replace(/_/g, ' ');
}

export function lifecycleStatusBadge(
    status: string | undefined,
): { label: string; className: string } {
    const s = (status ?? 'PENDING').toUpperCase();
    if (s === 'ACTIVE') {
        return {
            label: 'ACTIVE',
            className: 'bg-amber-50 text-amber-800 border-amber-200',
        };
    }
    if (s === 'PENDING') {
        return {
            label: 'UPCOMING',
            className: 'bg-sky-50 text-sky-800 border-sky-200',
        };
    }
    return {
        label: s,
        className: 'bg-slate-100 text-slate-600 border-slate-200',
    };
}
