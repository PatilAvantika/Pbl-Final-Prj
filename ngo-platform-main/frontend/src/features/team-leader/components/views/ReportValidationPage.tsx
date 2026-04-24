'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Button } from '@/features/team-leader/components/ui/button';
import { Badge } from '@/features/team-leader/components/ui/badge';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/features/team-leader/components/ui/tabs';
import { useReports, useReviewReport } from '@/features/team-leader/hooks/use-reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { ReportSubmission } from '@/features/team-leader/types/team-leader';

function markerIcon() {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
}

function ReportCard({
  r,
  index,
  showActions,
  onApprove,
  onReject,
  actionsDisabled,
}: {
  r: ReportSubmission;
  index: number;
  showActions: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  actionsDisabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{r.volunteerName}</CardTitle>
            <CardDescription>
              {r.taskTitle ? <span className="block font-medium text-foreground">{r.taskTitle}</span> : null}
              {new Date(r.submittedAt).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="rounded-lg">
              {r.wasteKg} items
            </Badge>
            {!showActions ? (
              <Badge
                variant={r.status === 'APPROVED' ? 'default' : 'destructive'}
                className="rounded-lg capitalize"
              >
                {r.status.toLowerCase()}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Before</p>
              <img
                src={r.beforeImageUrl}
                alt="Before"
                className="h-32 w-full rounded-2xl object-cover shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">After</p>
              <img
                src={r.afterImageUrl}
                alt="After"
                className="h-32 w-full rounded-2xl object-cover shadow-sm"
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Location</p>
            <div className="h-40 overflow-hidden rounded-2xl border shadow-sm">
              <MapContainer
                center={[r.latitude, r.longitude]}
                zoom={14}
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[r.latitude, r.longitude]} icon={markerIcon()} />
              </MapContainer>
            </div>
          </div>
          {showActions && onApprove && onReject ? (
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl" onClick={onApprove} disabled={actionsDisabled}>
                Approve
              </Button>
              <Button variant="destructive" className="rounded-xl" onClick={onReject} disabled={actionsDisabled}>
                Reject
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ReportValidationPage() {
  const { data: reports = [], isLoading, isError, error: reportsError, refetch } = useReports();
  const reviewMut = useReviewReport();

  const { pending, reviewed } = useMemo(() => {
    const p: ReportSubmission[] = [];
    const v: ReportSubmission[] = [];
    for (const r of reports) {
      if (r.status === 'PENDING') p.push(r);
      else v.push(r);
    }
    return { pending: p, reviewed: v };
  }, [reports]);

  const act = (r: ReportSubmission, status: 'APPROVED' | 'REJECTED') => {
    reviewMut.mutate({ id: r.id, status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Report validation</h1>
        <p className="text-muted-foreground mt-1">Pending reports for your organization (tasks you lead or tasks without a designated leader).</p>
      </div>
      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="font-semibold text-destructive">Could not load reports</p>
          <p className="mt-1 text-muted-foreground">{getApiErrorMessage(reportsError, 'GET /reports/team-leader failed.')}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}
      {isLoading && <Skeleton className="h-48 w-full rounded-2xl" />}
      {!isLoading && !isError ? (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="pending" className="rounded-xl">
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl">
              Reviewed ({reviewed.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {pending.map((r, i) => (
                <ReportCard
                  key={r.id}
                  r={r}
                  index={i}
                  showActions
                  onApprove={() => act(r, 'APPROVED')}
                  onReject={() => act(r, 'REJECTED')}
                  actionsDisabled={reviewMut.isPending}
                />
              ))}
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No pending reports.</p>
            ) : null}
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {reviewed.map((r, i) => (
                <ReportCard key={r.id} r={r} index={i} showActions={false} />
              ))}
            </div>
            {reviewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No reviewed reports yet.</p>
            ) : null}
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
