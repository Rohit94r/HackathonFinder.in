import test from 'node:test';
import assert from 'node:assert/strict';

import { safeNext } from './authUtils';

test('safeNext keeps paths on this site', () => {
  assert.equal(safeNext('/hackathons?city=pune#top'), '/hackathons?city=pune#top');
  assert.equal(safeNext('https://hackathonfinder.in/saved'), '/saved');
  assert.equal(safeNext(['/teams', '/x']), '/teams');
});

test('safeNext refuses anything that could leave the site', () => {
  for (const bad of ['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', '/ /evil.com', 'evil.com', 'javascript:alert(1)']) {
    assert.equal(safeNext(bad), null, bad);
  }
});

test('safeNext refuses auth pages and the API', () => {
  assert.equal(safeNext('/login'), null);
  assert.equal(safeNext('/api/me'), null);
  assert.equal(safeNext(null), null);
});
