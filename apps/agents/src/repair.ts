import { Hackathon, RawItem, type IHackathon } from '@hackathonfinder/db';
import { connectorBySlug } from './connectors';
import { cloudinaryConfig, ImageMirror, isStoredCopy } from './enrich/images';
import { errorMessage } from './errors';
import { Http } from './http';
import { normalize } from './pipeline/normalize';
import { derivedUpdate, writeCopy } from './pipeline/refresh';
import { notHackathonReason } from './pipeline/relevance';
import { validate } from './pipeline/validate';
import { placeRules } from './run';
import type { CandidateData, RawCandidate } from './types';

// Brings listings the scraper already made in line with the current rules, from the
// source data stored with them (RawItem), without asking the sources again: splits
// listings that wrongly merged two events of one platform, takes down events that
// aren't hackathon-type or are in-person abroad, and rewrites team size (and whether
// it is known), themes, our summary and tagline, prizes, and placeholder banners.
// Dates need the source's current timeline, so the next scrape refreshes those.

export interface RepairResult {
  checked: number;
  split: number;
  takenDown: { slug: string; title: string; reason: string }[];
  updated: number;
  fields: Record<string, number>;
  imagesRemoved: number;
}

export async function repairListings(opts: { dryRun?: boolean; log?: (line: string) => void; now?: Date } = {}): Promise<RepairResult> {
  const log = opts.log ?? (() => {});
  const now = opts.now ?? new Date();
  const write = !opts.dryRun;
  const out: RepairResult = { checked: 0, split: 0, takenDown: [], updated: 0, fields: {}, imagesRemoved: 0 };
  const mirror = new ImageMirror(new Http(), cloudinaryConfig());

  const docs = await Hackathon.find({ flags: { $ne: 'sample' }, 'sourceRefs.0': { $exists: true } }).lean<IHackathon[]>();
  for (const doc of docs) {
    out.checked++;
    try {
      // 1. One listing holding two ids from the same platform: keep the first, free the others.
      const seen = new Map<string, string>();
      const keep = (doc.sourceRefs ?? []).filter((r) => {
        if (!r.externalId) return true;
        const first = seen.get(r.source);
        if (first === undefined) {
          seen.set(r.source, r.externalId);
          return true;
        }
        return first === r.externalId;
      });
      if (keep.length < (doc.sourceRefs ?? []).length) {
        const dropped = (doc.sourceRefs ?? []).filter((r) => !keep.includes(r));
        log(`split "${doc.title}": ${dropped.map((r) => `${r.source}:${r.externalId}`).join(', ')} are other events`);
        if (write) {
          await Hackathon.updateOne({ _id: doc._id }, { $set: { sourceRefs: keep, sources: [...new Set(keep.map((r) => r.source))] } });
          // Their stored items go, so the next scrape creates them as the events they are.
          for (const r of dropped) await RawItem.deleteMany({ source: r.source, url: String(r.url) });
          // The kept event's own item is read again in full (its dates may hold the other event's).
          await RawItem.updateMany({ hackathonId: doc._id }, { $set: { pipelineVersion: 1 } });
        }
        out.split++;
        doc.sourceRefs = keep;
      }

      // 2. Re-derive from the creating source's stored data.
      const first = doc.sourceRefs[0];
      const raw = await RawItem.findOne({ hackathonId: doc._id, url: String(first.url) }).lean();
      const connector = raw ? connectorBySlug(raw.source) : undefined;
      if (!raw || !connector) continue;
      const cand: RawCandidate = { externalId: raw.externalId, url: raw.url, title: raw.title, text: raw.text, data: (raw.data ?? {}) as CandidateData, imageUrls: raw.imageUrls ?? [] };
      const d = normalize(cand, connector, { now });
      placeRules(d);

      const offTopic = notHackathonReason(d.title, cand.data.tags ?? []);
      const check = offTopic ? { ok: false as const, reason: offTopic } : validate(d, now, { isNew: false });
      const reason = check.ok ? undefined : (check as { reason: string }).reason;
      if (reason && (offTopic || /outside India/.test(reason)) && ['live', 'pending'].includes(doc.state) && !doc.verified) {
        out.takenDown.push({ slug: doc.slug, title: doc.title, reason });
        log(`take down "${doc.title}": ${reason}`);
        if (write) {
          await Hackathon.updateOne({ _id: doc._id }, { $set: { state: 'rejected', removedReason: reason.slice(0, 300), removedAt: now } });
          await RawItem.updateOne({ _id: raw._id }, { $set: { status: 'rejected', error: reason.slice(0, 500), pipelineVersion: 1 } });
        }
        continue;
      }

      // Images come from the next scrape (stored on Cloudinary); here a placeholder is only removed.
      d.imageUrl = undefined;
      d.sourceImageUrl = undefined;
      // The place on the listing was settled by the map lookup ("Kharghar" → Mumbai); the copy follows it.
      d.mode = doc.mode;
      d.city = doc.city || undefined;
      d.cityName = doc.cityName || undefined;
      writeCopy(d);
      const up = derivedUpdate(doc, d, { dates: false });
      if (!up.changed.length) continue;
      for (const k of up.changed) out.fields[k] = (out.fields[k] ?? 0) + 1;
      out.updated++;
      if (write) {
        await Hackathon.updateOne({ _id: doc._id }, { $set: up.set, ...(up.unset.length ? { $unset: Object.fromEntries(up.unset.map((k) => [k, 1])) } : {}) });
        if (up.unset.includes('imageUrl') && isStoredCopy(doc.imageUrl, mirror.cloudName)) {
          if (await mirror.destroy(doc.imageUrl!)) out.imagesRemoved++;
        }
      }
    } catch (err) {
      log(`could not repair "${doc.title}": ${errorMessage(err)}`);
    }
  }
  return out;
}

