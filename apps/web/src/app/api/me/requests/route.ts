import { route } from '@/server/api';
import { myRequests } from '@/server/teams';

/** Join requests the student sent, and requests to join their teams. */
export const GET = route(async ({ user }) => myRequests(user!.id), { auth: 'required' });
