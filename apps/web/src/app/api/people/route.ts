import { readQuery, route } from '@/server/api';
import { PeopleQuery, listPeople } from '@/server/teams';

/**
 * Students looking for a team. Filters: city, state, skills, q, near (lat,lng[,km]),
 * sort (newest|nearest|match, with match=<skills a team needs> or lack=<your skills>),
 * notMe, page, limit.
 */
export const GET = route(
  async ({ req, user }) => listPeople(readQuery(req, PeopleQuery), user?.id),
  { auth: 'optional', rate: { limit: 120, windowMs: 60_000, key: 'people' } }
);
