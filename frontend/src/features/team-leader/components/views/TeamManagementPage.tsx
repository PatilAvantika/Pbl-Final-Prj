'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/features/team-leader/components/ui/input';
import { Button } from '@/features/team-leader/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Badge } from '@/features/team-leader/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/features/team-leader/components/ui/avatar';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/team-leader/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/features/team-leader/components/ui/dialog';
import { useTeam, useOptimisticTeamAssign } from '@/features/team-leader/hooks/use-team';
import type { Volunteer } from '@/features/team-leader/types/team-leader';

export function TeamManagementPage() {
  const { data: volunteers = [], isLoading, isError } = useTeam();
  const assignMut = useOptimisticTeamAssign();
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState<string>('all');
  const [availability, setAvailability] = useState<string>('all');
  const [profile, setProfile] = useState<Volunteer | null>(null);

  const skills = useMemo(() => {
    const s = new Set<string>();
    volunteers.forEach((v) => v.skills?.forEach((x) => s.add(x)));
    return [...s].sort();
  }, [volunteers]);

  const filtered = useMemo(() => {
    return volunteers.filter((v) => {
      const matchQ =
        !q.trim() ||
        v.name.toLowerCase().includes(q.toLowerCase()) ||
        v.email?.toLowerCase().includes(q.toLowerCase());
      const matchSkill = skill === 'all' || (v.skills ?? []).includes(skill);
      const matchAvail = availability === 'all' || (v.availability ?? 'flexible') === availability;
      return matchQ && matchSkill && matchAvail;
    });
  }, [volunteers, q, skill, availability]);

  const onAssign = (v: Volunteer, assign: boolean) => {
    assignMut.mutate({ volunteers, volunteerId: v.id, assign });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Team management</h1>
        <p className="text-muted-foreground mt-1">Search, filter, and manage volunteers on your team.</p>
      </div>
      {isError && <p className="text-sm text-destructive">Could not load team. Showing empty list.</p>}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="text-lg">Volunteers</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                className="rounded-2xl pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger className="rounded-2xl sm:w-40">
                <SelectValue placeholder="Skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                {skills.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="rounded-2xl sm:w-44">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any availability</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="weekends">Weekends</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          {!isLoading &&
            filtered.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col gap-3 rounded-2xl border bg-card/50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-11 w-11 rounded-2xl">
                    {v.avatarUrl ? <AvatarImage src={v.avatarUrl} alt="" /> : null}
                    <AvatarFallback>{v.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.email ?? '—'}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(v.skills ?? []).slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="rounded-lg text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={v.teamId ? 'success' : 'outline'} className="rounded-lg">
                    {v.teamId ? 'On team' : 'Unassigned'}
                  </Badge>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setProfile(v)}>
                    View profile
                  </Button>
                  {v.teamId ? (
                    <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => onAssign(v, false)}>
                      Remove
                    </Button>
                  ) : (
                    <Button size="sm" className="rounded-xl" onClick={() => onAssign(v, true)}>
                      Add to team
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No volunteers match your filters.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!profile} onOpenChange={() => setProfile(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{profile?.name}</DialogTitle>
            <DialogDescription>Volunteer profile</DialogDescription>
          </DialogHeader>
          {profile && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span> {profile.email ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span> {profile.phone ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Availability:</span> {profile.availability ?? 'flexible'}
              </p>
              <div>
                <p className="text-muted-foreground mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {(profile.skills ?? []).map((s) => (
                    <Badge key={s} variant="secondary" className="rounded-lg">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
