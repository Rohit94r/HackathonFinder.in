import 'server-only';

// Sliding-window rate limits kept in memory. Good for one server process; with
// several instances, each one limits on its own (move this to Redis if that matters).

interface Bucket {
  hits: number[];
}

const g = globalThis as typeof globalThis & { __hfRate?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = g.__hfRate ?? (g.__hfRate = new Map());

/** Returns true if this hit is allowed: at most `limit` hits per `windowMs` for `key`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  // Keep memory bounded: drop idle buckets now and then.
  if (buckets.size > 50_000) {
    for (const [k, b] of buckets) if (!b.hits.length || now - b.hits[b.hits.length - 1] > windowMs) buckets.delete(k);
  }
  return true;
}
