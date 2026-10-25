import test from 'node:test';
import assert from 'node:assert/strict';

import { isAdminAccessEmail, normalizeAdminEmails } from '../lib/adminAccess';

test('admin email fallback includes the requested account', () => {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = '';

  try {
    assert.ok(normalizeAdminEmails(process.env.ADMIN_EMAILS).includes('rjdhav67@gmail.com'));
    assert.equal(isAdminAccessEmail('rjdhav67@gmail.com'), true);
    assert.equal(isAdminAccessEmail('someone@example.com'), false);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  }
});
