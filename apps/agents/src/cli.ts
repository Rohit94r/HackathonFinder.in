import { connectDb, disconnectDb, isDbConfigured, loadEnv } from '@hackathonfinder/db';
import { CONNECTORS } from './connectors';
import { errorMessage } from './errors';
import { runScrapeNow, startScheduler } from './launch';
import { redact, runScrape } from './run';
import { sourceStatuses, syncSources } from './sources';

// pnpm agents:run -- [--source unstop,devfolio] [--limit 20] [--dry-run]
// pnpm agents:schedule            long-running worker: scrapes at 02:00 and 14:00 IST
// pnpm agents:sources -- [--sync] lists sources, missing keys and health

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : '';
}

const has = (name: string) => process.argv.includes(`--${name}`);
const print = (line: string) => console.log(line);

async function run(): Promise<number> {
  const sources = arg('source')?.split(',').map((s) => s.trim()).filter(Boolean);
  const limit = Number(arg('limit')) || undefined;
  const dryRun = has('dry-run');
  if (dryRun || !isDbConfigured()) {
    if (!isDbConfigured()) print('MONGODB_URI is not set: dry run without the database.');
    const res = await runScrape({ trigger: 'manual', sources, limit, dryRun: true, log: print, useDb: isDbConfigured() });
    for (const i of res.items) print(`  ${i.action.padEnd(8)} ${i.source.padEnd(11)} ${i.title.slice(0, 70)}${i.city ? ` · ${i.city}` : i.mode === 'online' ? ' · Online' : ''}${i.reason ? `  (${i.reason.slice(0, 90)})` : ''}`);
    print(`\n${res.status}: ${JSON.stringify(res.counts)} unchanged ${res.unchanged} in ${Math.round(res.durationMs / 1000)} s`);
    return res.status === 'failed' ? 1 : 0;
  }
  await connectDb();
  const res = await runScrapeNow({ trigger: 'manual', sources, limit, log: print });
  if (res.skipped) {
    print(res.skipped === 'already-running' ? `A scrape is already running (run ${res.runId}).` : `This slot already ran (run ${res.runId}).`);
    return 1;
  }
  const r = res.result!;
  print(`\nRun ${res.runId}: ${r.status}. ${r.counts.created} live, ${r.counts.review} for review, ${r.counts.updated} updated, ${r.counts.merged} merged, ${r.unchanged} unchanged, ${r.counts.rejected} rejected, ${r.counts.errors} errors.`);
  print(`Images stored: ${r.images.stored} (failed ${r.images.failed}); map lookups: ${r.geocoding.requests} (${r.geocoding.found} found); ${Math.round(r.durationMs / 1000)} s.`);
  return r.status === 'failed' ? 1 : 0;
}

async function schedule(): Promise<number> {
  await connectDb();
  await syncSources();
  // The worker is the long-running process here, so it also catches up on a slot missed while it was off.
  startScheduler({ catchUp: !has('no-catch-up'), log: (l) => print(`[schedule] ${l}`), run: { log: (l) => print(`  ${l}`) } });
  print('Scheduler running. Ctrl+C to stop.');
  await new Promise<void>((resolve) => {
    process.once('SIGINT', resolve);
    process.once('SIGTERM', resolve);
  });
  return 0;
}

async function sources(): Promise<number> {
  if (!isDbConfigured()) {
    for (const c of CONNECTORS) print(`${c.slug.padEnd(12)} ${c.kind.padEnd(9)} ${(c.requiredEnv ?? []).length ? `needs ${(c.requiredEnv ?? []).join(', ')}` : 'ready'}  ${c.description}`);
    return 0;
  }
  await connectDb();
  if (has('sync')) {
    await syncSources();
    print('Sources synced.');
  }
  for (const s of await sourceStatuses()) {
    const env = s.missingEnv.length ? `needs ${s.missingEnv.join(', ')}` : s.optionalEnv.length ? `optional: ${s.optionalEnv.join(', ')}` : '';
    print(
      `${s.slug.padEnd(12)} ${(s.enabled ? 'on' : 'off').padEnd(4)} ${s.health.padEnd(9)} last ${s.lastRunAt ? new Date(s.lastRunAt).toISOString() : 'never'} (${s.lastItemCount ?? 0} items)${s.lastError ? ` error: ${s.lastError.slice(0, 80)}` : ''}${env ? `  [${env}]` : ''}`
    );
  }
  return 0;
}

async function main() {
  loadEnv();
  const command = process.argv[2];
  const commands: Record<string, () => Promise<number>> = { run, schedule, sources };
  if (!command || !commands[command]) {
    print('Usage: tsx src/cli.ts run [--source a,b] [--limit n] [--dry-run] | schedule [--no-catch-up] | sources [--sync]');
    process.exitCode = 2;
    return;
  }
  try {
    process.exitCode = await commands[command]();
  } catch (err) {
    console.error(redact(`Error: ${errorMessage(err)}`));
    process.exitCode = 1;
  } finally {
    await disconnectDb().catch(() => {});
  }
}

void main();
