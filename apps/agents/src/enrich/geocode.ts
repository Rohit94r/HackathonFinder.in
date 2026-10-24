import { CITIES, distanceKm, type City, type LatLng } from '@hackathonfinder/shared';
import { GeoCache } from '@hackathonfinder/db';
import { errorMessage } from '../errors';
import type { Http } from '../http';
import { cleanLine } from '../text';

// Venue → coordinates, so "near me" can sort in-person events by distance. We use
// OpenStreetMap's Nominatim within its usage policy: an honest User-Agent, at most
// one request a second, and every answer (found or not) cached in GeoCache so each
// place is asked about once. Data © OpenStreetMap contributors (ODbL).

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const PROVIDER = 'nominatim';
/** Ask again about a place that wasn't found after this long (new venues get added). */
const MISS_TTL_MS = 30 * 24 * 3600_000;
/** A venue found this far from its stated city is probably a different place with the same name. */
const MAX_VENUE_DRIFT_KM = 60;

export interface GeoHit extends LatLng {
  city?: string;
  state?: string;
  country?: string;
  displayName?: string;
}

export interface Located extends LatLng {
  /** true when the venue itself was found; false for the city centre. */
  exact: boolean;
  city?: string;
  state?: string;
  country?: string;
}

/** Cache key: lowercase, single spaces, no punctuation runs, capped. */
export function geoKey(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N},\s-]+/gu, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .slice(0, 300);
}

/** Venue text parts worth searching for: not the city, state, country or a PIN code. */
export function venueParts(venue: string | undefined, city: string | undefined, state: string | undefined): string[] {
  const drop = new Set([city, state, 'india', 'bharat'].filter(Boolean).map((s) => s!.toLowerCase()));
  return cleanLine(venue, 300)
    .split(',')
    .map((p) => p.replace(/\b\d{6}\b/g, '').trim())
    .filter((p) => p.length > 3 && !drop.has(p.toLowerCase()) && !/^\d+$/.test(p))
    .slice(0, 2);
}

/** Queries to try, most precise first: the venue in its city, then the city itself. */
export function geoQueries(d: { venue?: string; city?: string; region?: string }): { query: string; exact: boolean }[] {
  const tail = [d.city, d.region, 'India'].filter(Boolean).join(', ');
  const out: { query: string; exact: boolean }[] = [];
  for (const part of venueParts(d.venue, d.city, d.region)) out.push({ query: `${part}, ${tail}`, exact: true });
  if (d.city) out.push({ query: [d.city, d.region, 'India'].filter(Boolean).join(', '), exact: false });
  const seen = new Set<string>();
  return out.filter((q) => !seen.has(geoKey(q.query)) && seen.add(geoKey(q.query)));
}

/** The closest catalog city within `km`, for suburbs ("Kharghar" → Mumbai). */
export function nearestCatalogCity(point: LatLng, km: number): City | undefined {
  let best: City | undefined;
  let bestKm = Infinity;
  for (const c of CITIES) {
    const d = distanceKm(point, c);
    if (d < bestKm) [best, bestKm] = [c, d];
  }
  return bestKm <= km ? best : undefined;
}

const inIndia = (p: LatLng) => p.lat > 6 && p.lat < 37.5 && p.lng > 68 && p.lng < 97.5;

interface NominatimRow {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: Record<string, string>;
}

export class Geocoder {
  /** Lookups sent to Nominatim this run (cache hits aren't counted). */
  requests = 0;
  hits = 0;

  constructor(
    private readonly http: Http,
    private readonly opts: { useCache: boolean; log?: (line: string) => void } = { useCache: true }
  ) {
    // Nominatim's policy: an absolute maximum of one request per second.
    http.setHostDelay('nominatim.openstreetmap.org', 1100);
  }

  /** One free-text place in India, from the cache or Nominatim. Null when not found. */
  async lookup(query: string): Promise<GeoHit | null> {
    const key = geoKey(query);
    if (!key) return null;
    if (this.opts.useCache) {
      const cached = await GeoCache.findOne({ query: key }).lean();
      if (cached && (cached.found || Date.now() - new Date(cached.updatedAt).getTime() < MISS_TTL_MS)) {
        return cached.found && typeof cached.lat === 'number' && typeof cached.lng === 'number'
          ? { lat: cached.lat, lng: cached.lng, city: cached.city, state: cached.state, country: cached.country, displayName: cached.displayName }
          : null;
      }
    }
    const params = new URLSearchParams({ format: 'jsonv2', countrycodes: 'in', limit: '1', addressdetails: '1', 'accept-language': 'en', q: query.slice(0, 250) });
    let rows: NominatimRow[];
    try {
      this.requests++;
      // Nominatim is an API with its own usage policy (followed above); its robots.txt is for crawlers.
      rows = await this.http.fetchJson<NominatimRow[]>(`${NOMINATIM}?${params}`, { officialApi: true, retries: 2, timeoutMs: 15_000 });
    } catch (err) {
      this.opts.log?.(`geocode: lookup failed (${errorMessage(err)}); not cached`);
      return null;
    }
    const row = Array.isArray(rows) ? rows[0] : undefined;
    const lat = Number(row?.lat);
    const lng = Number(row?.lon);
    const found = Boolean(row) && Number.isFinite(lat) && Number.isFinite(lng) && inIndia({ lat, lng });
    const a = row?.address ?? {};
    const hit: GeoHit | null = found
      ? {
          lat,
          lng,
          // The town, else its district ("Pune District" → "Pune"); a village only as a last resort.
          city:
            cleanLine(a.city ?? a.town ?? a.municipality ?? (a.state_district ?? a.county)?.replace(/\s+(district|subdistrict|tahsil|taluka)$/i, '') ?? a.village, 80) || undefined,
          state: cleanLine(a.state ?? a.union_territory, 80) || undefined,
          country: cleanLine(a.country, 60) || 'India',
          displayName: cleanLine(row?.display_name, 400) || undefined,
        }
      : null;
    if (this.opts.useCache) {
      await GeoCache.updateOne(
        { query: key },
        { $set: { found, lat: hit?.lat, lng: hit?.lng, city: hit?.city, state: hit?.state, country: hit?.country, displayName: hit?.displayName, provider: PROVIDER } },
        { upsert: true }
      ).catch((err) => this.opts.log?.(`geocode: cache write failed (${errorMessage(err)})`));
    }
    if (hit) this.hits++;
    return hit;
  }

  /**
   * Where an in-person event is: the venue when Nominatim knows it (and it lies near
   * the stated city), else the city. `catalogCentre` is the stated catalog city's centre.
   */
  async locate(d: { venue?: string; city?: string; region?: string }, catalogCentre?: LatLng): Promise<Located | null> {
    let cityPoint: LatLng | undefined = catalogCentre;
    for (const q of geoQueries(d)) {
      if (!q.exact && catalogCentre) break; // the catalog already knows this city's centre
      const hit = await this.lookup(q.query);
      if (!hit) continue;
      // A place in another state is a namesake, not this venue or city.
      if (d.region && hit.state && !sameState(d.region, hit.state)) continue;
      if (q.exact) {
        const anchor = cityPoint;
        if (anchor && distanceKm(anchor, hit) > MAX_VENUE_DRIFT_KM) continue;
      } else {
        cityPoint = hit;
      }
      return { lat: hit.lat, lng: hit.lng, exact: q.exact, city: hit.city, state: hit.state, country: hit.country };
    }
    return null;
  }
}

/** "Delhi" vs "National Capital Territory of Delhi", "Orissa" vs "Odisha". */
function sameState(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/national capital territory of|nct of|union territory of|state of/g, '')
      .replace(/orissa/, 'odisha')
      .replace(/pondicherry/, 'puducherry')
      .replace(/[^a-z]/g, '');
  const x = norm(a);
  const y = norm(b);
  return !x || !y || x === y || x.includes(y) || y.includes(x);
}
