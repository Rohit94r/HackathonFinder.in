'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { readStore, useStore, writeStore } from './localStore';

/** Things a student does on HackathonFinder; they feed the profile heatmap and stats. */
export type ActivityType = 'saved' | 'registered' | 'submitted' | 'done' | 'team-post' | 'thread' | 'reply' | 'win';

export interface Activity {
  id: string;
  type: ActivityType;
  /** Short description, e.g. the hackathon or thread title. */
  label: string;
  href?: string;
  /** ISO timestamp. */
  at: string;
}

const KEY = 'hf_activity_v1';
const LIMIT = 500;

/**
 * Records a signed-out student's action in this browser. Signed-in actions are
 * logged by the server when the API call succeeds, so don't call this for those.
 */
export function logActivity(entry: Omit<Activity, 'id' | 'at'>) {
  const now = new Date();
  const item: Activity = { ...entry, id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`, at: now.toISOString() };
  writeStore(KEY, [item, ...readStore<Activity[]>(KEY, [])].slice(0, LIMIT));
}

/** Newest first: the account's activity when signed in, this browser's otherwise. */
export function useActivity() {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [local, , localReady] = useStore<Activity[]>(KEY, []);
  const { data } = useSWR<{ items: Activity[] }>(signedIn ? '/api/me/activity' : null);
  const items = signedIn ? data?.items ?? [] : local;
  const ready = status !== 'loading' && (signedIn ? data !== undefined : localReady);
  return { items, ready };
}
