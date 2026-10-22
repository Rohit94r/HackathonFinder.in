'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Person } from '@/data/people';
import ActivityHeatmap, { HeatmapSkeleton } from './ActivityHeatmap';
import { istDayKey, sampleActivityCounts } from './heatmap';

/** A sample student's heatmap. Today is read after mount, so server and browser markup match. */
export default function PersonHeatmap({ person }: { person: Person }) {
  const [todayKey, setTodayKey] = useState<string | null>(null);

  useEffect(() => setTodayKey(istDayKey(Date.now())), []);

  const counts = useMemo(() => (todayKey ? sampleActivityCounts(person, todayKey) : {}), [person, todayKey]);

  if (!todayKey) return <HeatmapSkeleton />;
  return <ActivityHeatmap counts={counts} todayKey={todayKey} />;
}
