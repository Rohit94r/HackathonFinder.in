import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AgentRun, User } from '@hackathonfinder/db';
import { acquireRun, failStaleRuns, markRunFailed, STALE_RUN_MS } from '../src/lock';
import { clearDb, startDb, stopDb } from './db';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe('one scrape at a time', () => {
  it('starts a run, then hands back the running one', async () => {
    const first = await acquireRun({ trigger: 'manual' });
    expect(first.kind).toBe('started');
    const second = await acquireRun({ trigger: 'manual' });
    expect(second).toEqual({ kind: 'already-running', runId: first.runId });
    expect(await AgentRun.countDocuments({ status: 'running' })).toBe(1);
  });

  it('lets the database settle a race between two servers', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => acquireRun({ trigger: 'manual' })));
    expect(results.filter((r) => r.kind === 'started')).toHaveLength(1);
    expect(new Set(results.map((r) => r.runId)).size).toBe(1);
  });

  it('takes a run stuck for over 45 minutes as dead', async () => {
    const old = await AgentRun.create({ agent: 'scrape', status: 'running', trigger: 'schedule', startedAt: new Date(Date.now() - STALE_RUN_MS - 60_000) });
    const next = await acquireRun({ trigger: 'manual' });
    expect(next.kind).toBe('started');
    const dead = await AgentRun.findById(old._id).lean();
    expect(dead?.status).toBe('failed');
    expect(dead?.errorLog.join(' ')).toMatch(/45 minutes/);
    expect(await failStaleRuns()).toBe(0);
  });

  it('runs each scheduled slot once', async () => {
    const slot = '2026-10-25T02:00+05:30';
    const a = await acquireRun({ trigger: 'schedule', slot });
    expect(a.kind).toBe('started');
    await AgentRun.updateOne({ _id: a.runId }, { $set: { status: 'success' } });
    expect(await acquireRun({ trigger: 'schedule', slot })).toEqual({ kind: 'slot-taken', runId: a.runId });
    expect((await acquireRun({ trigger: 'schedule', slot: '2026-10-25T14:00+05:30' })).kind).toBe('started');
  });

  it('records who pressed "Scrape now" and marks crashed runs failed', async () => {
    const admin = await User.create({ name: 'Admin', handle: 'admin1', email: 'admin@example.com', role: 'admin' });
    const run = await acquireRun({ trigger: 'manual', startedBy: String(admin._id), sources: ['unstop'] });
    const doc = await AgentRun.findById(run.runId).lean();
    expect(String(doc?.startedBy)).toBe(String(admin._id));
    expect(doc?.sources).toEqual(['unstop']);
    await markRunFailed(run.runId, new Error('boom'));
    expect((await AgentRun.findById(run.runId).lean())?.status).toBe('failed');
    // The handle works too.
    const byHandle = await acquireRun({ trigger: 'manual', startedBy: 'admin1' });
    expect(String((await AgentRun.findById(byHandle.runId).lean())?.startedBy)).toBe(String(admin._id));
  });
});
