'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { Inbox, JoinRequest, TeamInvite, TeamPostsPage } from '@/data/teamPosts';

// The signed-in student's own Team Finder data. Everything is on their account;
// signed out, these stay empty and `ready` is true.

const MY_POSTS = '/api/team-posts?author=me&limit=50';
const MY_REQUESTS = '/api/me/requests';
const MY_INVITES = '/api/me/invites';

function useMine<T>(key: string) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const { data, error, mutate } = useSWR<T>(signedIn ? key : null);
  const ready = status === 'unauthenticated' || (signedIn && (data !== undefined || error !== undefined));
  return { data, ready, signedIn, mutate };
}

/** Team posts the student made, open and closed, newest first. */
export function useMyTeamPosts() {
  const { data, ready, mutate } = useMine<TeamPostsPage>(MY_POSTS);
  return { posts: data?.items ?? [], ready, mutate };
}

/** Requests the student sent, and requests to join their teams. */
export function useMyRequests() {
  const { data, ready, mutate } = useMine<Inbox<JoinRequest>>(MY_REQUESTS);
  return { requests: data ?? { sent: [], received: [] }, ready, mutate };
}

/** Invites the student sent and received. */
export function useMyInvites() {
  const { data, ready, mutate } = useMine<Inbox<TeamInvite>>(MY_INVITES);
  return { invites: data ?? { sent: [], received: [] }, ready, mutate };
}
