import { adminRoute, getSubmissionDetail, idParam } from '@/server/admin';

/** One submission with everything the reviewer needs, and its draft as editor fields. */
export const GET = adminRoute<{ id: string }>(async ({ params }) => getSubmissionDetail(idParam(params.id, 'That submission')));
