import test from 'node:test';
import assert from 'node:assert/strict';

import { grantsAdminAccess, isAdminAccessEmail, normalizeAdminEmails } from '../lib/adminAccess';

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

test('an admin email grants admin only after it is verified', () => {
  assert.equal(grantsAdminAccess({ email: 'rjdhav67@gmail.com', emailVerified: null }), false);
  assert.equal(grantsAdminAccess({ email: 'RJDHAV67@gmail.com', emailVerified: new Date() }), true);
  assert.equal(grantsAdminAccess({ email: 'someone@example.com', emailVerified: new Date() }), false);
  assert.equal(grantsAdminAccess(null), false);
});

test('ADMIN_EMAILS from the environment are trimmed, lowercased and deduplicated', () => {
  assert.deepEqual(normalizeAdminEmails(' A@x.in, rjdhav67@gmail.com ,,a@x.in'), ['a@x.in', 'rjdhav67@gmail.com']);
});
