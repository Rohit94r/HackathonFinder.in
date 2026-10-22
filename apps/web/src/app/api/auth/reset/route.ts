import { z } from 'zod';
import { User } from '@hackathonfinder/db';
import { badRequest, readBody, route } from '@/server/api';
import { consumeToken } from '@/server/tokens';
import { hashPassword, passwordProblem } from '@/server/users';

const Body = z.object({ token: z.string().min(10), password: z.string() });

export const POST = route(
  async ({ req }) => {
    const { token, password } = await readBody(req, Body);
    const problem = passwordProblem(password);
    if (problem) throw badRequest(problem, { password: problem });
    const userId = await consumeToken('reset-password', token);
    if (!userId) throw badRequest('This reset link has expired or was already used. Ask for a new one.');
    // Opening the emailed link proves they own the address.
    await User.updateOne(
      { _id: userId },
      { $set: { passwordHash: await hashPassword(password), emailVerified: new Date() } }
    );
    const user = await User.findById(userId).select('email').lean();
    return { ok: true, email: user?.email };
  },
  { auth: 'none', rate: { limit: 10, windowMs: 60 * 60 * 1000, key: 'reset' } }
);
