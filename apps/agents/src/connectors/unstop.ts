import type { Mode } from '@hackathonfinder/shared';
import { parseDate } from '../dates';
import { cleanLine } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { arr, eligibilityFrom, firstImage, int, isObj, labels, moneyLine, num, plainText, str, url, type Obj } from './util';

// Unstop's public listing API (robots.txt allows /api/public/*). The list has most
// fields; the banner and the real event dates are only on each competition's page,
// which the runner asks for just for new listings and ones still without an image.

const API = 'https://unstop.com/api/public';
const PER_PAGE = 100;
const MAX_PAGES = 10;

const MODES: Record<string, Mode> = { online: 'online', offline: 'offline', hybrid: 'hybrid' };

/** Rows in "Important dates" that look like the event itself, not paperwork around it. */
const EVENT_ROW = /\b(hackathon|finale|finals?|final round|grand|main event|offline round|on-?site|hack ?day|day ?1|inaugurat\w*|kick ?off|event day|build ?phase|coding round|presentation)\b/i;
const PAPERWORK_ROW = /\b(results?|winners?|announce\w*|shortlist\w*|registration|register|last date|deadline|submission deadline|certificate|notification)\b/i;

interface DateRow {
  title: string;
  start?: Date;
  end?: Date;
}

/**
 * When the event happens. Unstop's own start_date is when the listing opened, so it
 * can't be used: the first finale-like "important date" or round at or after the
 * registration deadline wins, and the deadline itself when nothing else is known.
 */
export function unstopEventDates(deadline: Date | undefined, listEnd: Date | undefined, rows: DateRow[]): { start?: Date; end?: Date } {
  if (!deadline) return { start: undefined, end: listEnd };
  const after = rows.filter((r) => r.start && r.start.getTime() >= deadline.getTime() - 24 * 3600_000);
  const eventRow = after
    .filter((r) => EVENT_ROW.test(r.title) && !PAPERWORK_ROW.test(r.title))
    .sort((a, b) => a.start!.getTime() - b.start!.getTime())[0];
  const firstAfter = after.filter((r) => !PAPERWORK_ROW.test(r.title)).sort((a, b) => a.start!.getTime() - b.start!.getTime())[0];
  const start = eventRow?.start ?? firstAfter?.start ?? deadline;
  const ends = [listEnd, ...rows.map((r) => r.end), start].filter((d): d is Date => Boolean(d) && d!.getTime() >= start.getTime() && !Number.isNaN(d!.getTime()));
  // The latest round end (or the listing's end) is when it is over.
  const end = ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : start;
  return { start, end };
}

function prizeCurrency(p: Obj): 'INR' | 'USD' {
  const code = String(p.currencyCode ?? '').toUpperCase();
  if (code === 'USD' || /dollar|usd/i.test(String(p.currency ?? ''))) return 'USD';
  return 'INR';
}

/** Cash prizes: the "Prize Pool" row when there is one, else the sum of cash rows; plus readable lines. */
export function unstopPrizes(prizes: unknown[]): { pool?: number; currency: 'INR' | 'USD'; lines: string[] } {
  const rows = prizes.filter(isObj);
  // "kind" rows carry the value of goodies or credits; only cash counts toward the prize pool.
  const cash = rows.filter((p) => (num(p.cash) ?? 0) > 0 && p.prize_type !== 'kind');
  const currency = cash.length ? prizeCurrency(cash[0]) : 'INR';
  const poolRow = cash.find((p) => /pool|total/i.test(String(p.rank ?? '')));
  const pool = poolRow ? num(poolRow.cash) : cash.length ? cash.reduce((s, p) => s + (num(p.cash) ?? 0), 0) : undefined;
  const lines = rows
    .map((p) => {
      const rank = cleanLine(str(p.rank), 60);
      const amount = num(p.cash);
      const label = rank && /^\d+$/.test(rank) ? `Rank ${rank}` : rank;
      if (amount && amount > 0) return `${label || 'Prize'}: ${moneyLine(amount, prizeCurrency(p))}${p.prize_type === 'kind' ? ' (in kind)' : ''}`;
      return '';
    })
    .filter(Boolean)
    .slice(0, 6);
  return { pool: pool && pool > 0 ? Math.round(pool) : undefined, currency, lines };
}

function parseJson(v: unknown): Obj {
  if (isObj(v)) return v;
  if (typeof v !== 'string') return {};
  try {
    const parsed = JSON.parse(v);
    return isObj(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** One opportunity from the list API as a candidate (no banner yet; see detail()). */
export function unstopCandidate(item: Obj): RawCandidate | null {
  const id = str(item.id, 40);
  const title = cleanLine(str(item.title), 140);
  if (!id || !title) return null;
  const pageUrl = url(item.seo_url) ?? url(str(item.public_url) ? `https://unstop.com/${str(item.public_url)}` : undefined);
  if (!pageUrl || !/^https:\/\/unstop\.com\//.test(pageUrl)) return null;

  const org = isObj(item.organisation) ? item.organisation : {};
  const addr = isObj(item.address_with_country_logo) ? item.address_with_country_logo : {};
  const regn = isObj(item.regnRequirements) ? item.regnRequirements : {};
  const mode = MODES[String(item.region ?? '').toLowerCase()];
  const eligibilityJson = parseJson(regn.eligibility);
  const sectors = arr(eligibilityJson.sector).map(String);
  const audience = labels(arr(item.filters).filter((f) => isObj(f) && f.type === 'eligible'), 20);
  const eligibility = eligibilityFrom([...audience, ...sectors.map((s) => (s === 'corporates' ? 'professionals' : s === 'school' ? 'school students' : s))]);
  const payment = arr(item.payment_services).find(isObj);
  const fee = num(payment?.amount);
  const prizes = unstopPrizes(arr(item.prizes));
  const deadline = parseDate(str(regn.end_regn_dt), { kind: 'deadline' });
  const listEnd = parseDate(str(item.end_date), { kind: 'end' });
  const { start, end } = unstopEventDates(deadline, listEnd, []);
  const country = isObj(addr.country) ? str(addr.country.name, 60) : undefined;

  const data: CandidateData = {
    title,
    organizer: cleanLine(str(org.name), 140) || undefined,
    mode,
    city: mode && mode !== 'online' ? str(addr.city, 80) : undefined,
    region: mode && mode !== 'online' ? str(addr.state, 80) : undefined,
    venue: mode && mode !== 'online' ? cleanLine(str(addr.address), 200) || undefined : undefined,
    country: mode && mode !== 'online' ? country ?? 'India' : 'India',
    lat: num(addr.lat),
    lng: num(addr.lng),
    startDate: start?.toISOString(),
    endDate: end?.toISOString(),
    registrationDeadline: deadline?.toISOString(),
    teamMin: int(regn.min_team_size, 1, 50),
    teamMax: int(regn.max_team_size, 1, 50),
    isPaid: item.isPaid === true,
    fee: item.isPaid === true ? (fee !== undefined && fee >= 0 ? fee : undefined) : 0,
    prizePool: prizes.pool,
    prizeCurrency: prizes.currency,
    prizes: prizes.lines,
    tags: labels([...arr(item.workfunction), ...arr(item.required_skills)], 10),
    eligibility: eligibility.length ? eligibility : undefined,
    logoUrl: firstImage(item.logoUrl2, org.logoUrl2, org.logoUrl),
    registrationUrl: pageUrl,
  };
  return { externalId: id, url: pageUrl, title, text: [title, plainText(item.details)].join('\n\n'), data, imageUrls: [] };
}

/** Adds what only the competition page has: the banner, real event dates, fee and women-only. */
export function unstopApplyDetail(c: RawCandidate, comp: Obj): RawCandidate {
  const data: CandidateData = { ...c.data };
  const banner = isObj(comp.banner) ? comp.banner : {};
  const mobile = isObj(comp.banner_mobile) ? comp.banner_mobile : {};
  const meta = isObj(comp.meta_info) ? comp.meta_info : {};
  const seo = arr(comp.seo_details).find(isObj) ?? {};
  const image = firstImage(banner.image_url, mobile.image_url, meta.sharable_image_url, seo.sharable_image_url);
  if (image) data.imageUrl = image;

  const rows: DateRow[] = [];
  for (const r of arr(comp.datesToshow).filter(isObj)) {
    rows.push({ title: cleanLine(str(r.title), 120), start: parseDate(str(r.important_date), { kind: 'start' }) });
  }
  for (const round of arr(comp.rounds).filter(isObj)) {
    const details = isObj(round.details) ? Object.values(round.details).filter(isObj) : [];
    for (const d of details) {
      rows.push({ title: cleanLine(str(d.title), 120), start: parseDate(str(d.start_date), { kind: 'start' }), end: parseDate(str(d.end_date), { kind: 'end' }) });
    }
  }
  const regn = isObj(comp.regnRequirements) ? comp.regnRequirements : {};
  const deadline = parseDate(str(regn.end_regn_dt), { kind: 'deadline' }) ?? parseDate(data.registrationDeadline, { kind: 'deadline' });
  const { start, end } = unstopEventDates(deadline, parseDate(str(comp.end_date), { kind: 'end' }) ?? parseDate(data.endDate, { kind: 'end' }), rows);
  if (start) data.startDate = start.toISOString();
  if (end) data.endDate = end.toISOString();
  if (deadline) data.registrationDeadline = deadline.toISOString();

  const payment = arr(comp.payment_services).find(isObj);
  const fee = num(payment?.amount);
  if (fee !== undefined && fee >= 0 && (data.isPaid || fee > 0)) {
    data.fee = fee;
    data.isPaid = fee > 0;
  }
  if (!data.prizePool) {
    const text = cleanLine(str(comp.overall_prizes), 300);
    if (text) data.prizeText = text;
  }
  const gender = arr(regn.gender).map(String);
  if (gender.length === 1 && gender[0] === 'F') data.eligibility = ['women-only', ...(data.eligibility ?? []).filter((e) => e !== 'women-only')];
  const text = plainText(comp.details);
  return { ...c, data, text: text ? [c.title ?? data.title, text].join('\n\n') : c.text, imageUrls: image ? [image] : c.imageUrls };
}

export const unstop: Connector = {
  slug: 'unstop',
  name: 'Unstop',
  kind: 'platform',
  defaultSchedule: '0 2,14 * * *',
  description: 'Open hackathons from Unstop’s public API, with banners and event dates from each competition page.',
  trust: 0.9,
  extract: 'missing',
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const out: RawCandidate[] = [];
    const seen = new Set<string>();
    let lastPage = 1;
    for (let page = 1; page <= Math.min(lastPage, MAX_PAGES); page++) {
      const json = await ctx.http.fetchJson<{ data?: { data?: unknown[]; last_page?: number } }>(
        `${API}/opportunity/search-result?opportunity=hackathons&per_page=${PER_PAGE}&oppstatus=open&page=${page}`
      );
      const rows = arr(json?.data?.data).filter(isObj);
      lastPage = int(json?.data?.last_page, 1, 1000) ?? 1;
      for (const row of rows) {
        try {
          const c = unstopCandidate(row);
          if (c && !seen.has(c.externalId!)) {
            seen.add(c.externalId!);
            out.push(c);
          }
        } catch (err) {
          ctx.warn(`unstop: skipped one listing (${(err as Error).message})`);
        }
        if (out.length >= ctx.limit) return out;
      }
      if (!rows.length) break;
    }
    ctx.log(`unstop: ${out.length} open hackathons`);
    return out;
  },
  async detail(c: RawCandidate, ctx: ConnectorContext): Promise<RawCandidate> {
    if (!c.externalId || !/^\d+$/.test(c.externalId)) return c;
    const json = await ctx.http.fetchJson<{ data?: { competition?: unknown } }>(`${API}/competition/${c.externalId}`);
    const comp = json?.data?.competition;
    return isObj(comp) ? unstopApplyDetail(c, comp) : c;
  },
};
