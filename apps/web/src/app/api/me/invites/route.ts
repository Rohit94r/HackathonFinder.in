import { route } from '@/server/api';
import { myInvites } from '@/server/teams';

/** Invites the student sent, and invites they received. */
export const GET = route(async ({ user }) => myInvites(user!.id), { auth: 'required' });
