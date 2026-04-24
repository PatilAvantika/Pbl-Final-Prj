import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/features/team-leader/components/ui/card';

export function KpiGridSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-slate-200/80">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="mt-2 h-3 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function ChartSkeleton({ className }: { className?: string }) {
    return (
        <Card className={`border-slate-200/80 ${className ?? ''}`}>
            <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[220px] w-full rounded-xl" />
            </CardContent>
        </Card>
    );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
        </div>
    );
}
