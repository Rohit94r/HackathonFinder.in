import { z } from 'zod';
import { User } from '@hackathonfinder/db';
import { badRequest, conflict, readBody, route } from '@/server/api';
import { sendVerificationEmail } from '@/server/accountEmails';
import { hashPassword, isAdminEmail, passwordProblem, uniqueHandle } from '@/server/users';

const Body = z.object({
  name: z.string().trim().min(2, 'Add your name.').max(80),
  email: z.string().trim().toLowerCase().email('Add a valid email.'),
  password: z.string().min(1, 'Choose a password.'),
});

/** Creates an email-and-password account. The client signs in right after. */
export const POST = route(
  async ({ req }) => {
    const body = await readBody(req, Body);
    const problem = passwordProblem(body.password);
    if (problem) throw badRequest(problem, { password: problem });
    if (await User.exists({ email: body.email })) {
      throw conflict('An account with this email already exists. Sign in instead, or reset your password.');
    }
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      handle: await uniqueHandle(body.name),
      role: isAdminEmail(body.email) ? 'admin' : 'student',
    });
    await sendVerificationEmail(user);
    return { ok: true, handle: user.handle };
  },
  { auth: 'none', rate: { limit: 5, windowMs: 60 * 60 * 1000, key: 'register' } }
);
