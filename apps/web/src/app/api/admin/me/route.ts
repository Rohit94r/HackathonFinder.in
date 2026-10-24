import { adminRoute } from '@/server/admin';

/** 200 with the admin's handle when the session is an admin, 401/403 otherwise. Used by the admin sign-in. */
export const GET = adminRoute(async ({ user }) => ({ id: user.id, handle: user.handle, name: user.name }));
