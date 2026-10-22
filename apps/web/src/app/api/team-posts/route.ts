import { readBody, readQuery, route, unauthorized } from '@/server/api';
import { NewTeamPost, TeamPostQuery, createTeamPost, listTeamPosts } from '@/server/teams';

/**
 * Open team posts for open hackathons, all over India. Filters: city (slug or 'online'),
 * state, hackathon, skills + skillIn (needs|has), mode, q, near (lat,lng[,km]),
 * sort (newest|nearest|match, with match=<your skills>), author (me|handle), notMine, counts, page, limit.
 */
export const GET = route(
  async ({ req, user }) => {
    const query = readQuery(req, TeamPostQuery);
    if (query.author === 'me' && !user) throw unauthorized();
    return listTeamPosts(query, user?.id);
  },
  { auth: 'optional', rate: { limit: 120, windowMs: 60_000, key: 'team-posts' } }
);

/** Posts a team for an open hackathon. */
export const POST = route(
  async ({ req, user }) => {
    const body = await readBody(req, NewTeamPost);
    return { post: await createTeamPost(user!, body) };
  },
  { auth: 'required', rate: { limit: 20, windowMs: 60 * 60_000, key: 'team-post-create' } }
);
