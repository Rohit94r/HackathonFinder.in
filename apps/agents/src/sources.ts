import { Source, type ISource } from '@hackathonfinder/db';
import { CONNECTORS, connectorBySlug, missingEnv } from './connectors';
import { BlockedError, errorMessage } from './errors';
import type { Connector } from './types';

// Source documents: one per connector, holding the admin's on/off switch, extra
// settings and the health of recent runs. Created on first use.

export interface SourceStatus {
  slug: string;
  name: string;
  kind: string;
  description: string;
  enabled: boolean;
  missingEnv: string[];
  optionalEnv: string[];
  health: ISource['health'];
  lastRunAt?: Date;
  lastSuccessAt?: Date;
  lastError?: string;
  lastItemCount?: number;
}

function defaults(c: Connector) {
  return { name: c.name, kind: c.kind, schedule: c.defaultSchedule };
}

/** Creates missing Source docs and keeps name/kind/schedule in step with the code. Never touches enabled or config once set. */
export async function syncSources(): Promise<void> {
  await Source.bulkWrite(
    CONNECTORS.map((c) => ({
      updateOne: {
        filter: { slug: c.slug },
        update: {
          $set: defaults(c),
          $setOnInsert: { enabled: !c.disabledByDefault, config: c.defaultConfig ?? {}, consecutiveFailures: 0, health: 'unknown' },
        },
        upsert: true,
      },
    }))
  );
}

/** Every connector with its Source doc's switch and health. */
export async function sourceStatuses(env: NodeJS.ProcessEnv = process.env): Promise<SourceStatus[]> {
  const docs = await Source.find({ slug: { $in: CONNECTORS.map((c) => c.slug) } }).lean();
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  return CONNECTORS.map((c) => {
    const d = bySlug.get(c.slug);
    return {
      slug: c.slug,
      name: c.name,
      kind: c.kind,
      description: c.description,
      enabled: d ? d.enabled !== false : !c.disabledByDefault,
      missingEnv: missingEnv(c, env),
      optionalEnv: (c.optionalEnv ?? []).filter((k) => !env[k]),
      health: d?.health ?? 'unknown',
      lastRunAt: d?.lastRunAt,
      lastSuccessAt: d?.lastSuccessAt,
      lastError: d?.lastError || undefined,
      lastItemCount: d?.lastItemCount,
    };
  });
}

/** Turns a source on or off for future runs. Throws for an unknown slug. */
export async function setSourceEnabled(slug: string, enabled: boolean): Promise<void> {
  const c = connectorBySlug(String(slug));
  if (!c) throw new Error(`Unknown source "${String(slug).slice(0, 40)}"`);
  await Source.updateOne(
    { slug: c.slug },
    { $set: { ...defaults(c), enabled: Boolean(enabled) }, $setOnInsert: { config: c.defaultConfig ?? {}, consecutiveFailures: 0, health: 'unknown' } },
    { upsert: true }
  );
}

/** Settings and switch per connector slug (defaults when there's no doc yet). */
export async function sourceSettings(): Promise<Map<string, { enabled: boolean; config: Record<string, unknown> }>> {
  const docs = await Source.find({ slug: { $in: CONNECTORS.map((c) => c.slug) } })
    .select('slug enabled config')
    .lean();
  const map = new Map<string, { enabled: boolean; config: Record<string, unknown> }>();
  for (const c of CONNECTORS) map.set(c.slug, { enabled: !c.disabledByDefault, config: c.defaultConfig ?? {} });
  for (const d of docs) map.set(d.slug, { enabled: d.enabled !== false, config: { ...(map.get(d.slug)?.config ?? {}), ...(d.config ?? {}) } });
  return map;
}

/** Health after one run of a source. */
export async function recordSourceRun(slug: string, result: { ok: true; items: number; warnings: number } | { ok: false; error: unknown }, now = new Date()): Promise<void> {
  if (result.ok) {
    await Source.updateOne(
      { slug },
      { $set: { lastRunAt: now, lastSuccessAt: now, lastError: '', lastItemCount: result.items, consecutiveFailures: 0, health: result.warnings ? 'degraded' : 'ok' } }
    );
    return;
  }
  const error = 'error' in result ? result.error : undefined;
  const blocked = error instanceof BlockedError;
  const doc = await Source.findOneAndUpdate(
    { slug },
    { $set: { lastRunAt: now, lastError: errorMessage(error).slice(0, 500), lastItemCount: 0 }, $inc: { consecutiveFailures: 1 } },
    { returnDocument: 'after' }
  ).lean();
  const failures = doc?.consecutiveFailures ?? 1;
  await Source.updateOne({ slug }, { $set: { health: blocked ? 'blocked' : failures >= 3 ? 'failing' : 'degraded' } });
}
