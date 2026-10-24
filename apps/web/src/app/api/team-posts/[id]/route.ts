import { notFound, objectId, readBody, route } from '@/server/api';
import { TeamPostPatch, removeTeamPost, updateTeamPost } from '@/server/teams';

type Params = { id: string };

/** The author updates their post: idea, skills, members, team size, open or closed. */
export const PATCH = route<Params>(
  async ({ req, params, user, ip }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That team post');
    const patch = await readBody(req, TeamPostPatch);
    return { post: await updateTeamPost(user!, params.id, patch, ip) };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000, key: 'team-post-edit' } }
);

/** The author (or an admin) removes a post. Soft delete. */
export const DELETE = route<Params>(
  async ({ params, user }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That team post');
    await removeTeamPost(user!, params.id);
    return { ok: true };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000, key: 'team-post-edit' } }
);
