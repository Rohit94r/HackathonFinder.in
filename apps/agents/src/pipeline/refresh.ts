import { templateSummary, templateTagline } from '@hackathonfinder/ai';
import type { IHackathon } from '@hackathonfinder/db';
import { isPlaceholderImage } from '../text';
import type { Draft } from './draft';

// Fields we derive from what a source says (our own summary and tagline, themes, team
// size, the source's timeline). When the rules that derive them change, listings we
// created are rewritten from their source data. Admin-verified listings keep their
// copy and themes; summaries someone wrote by hand are never replaced.

/** Our tagline and template summary for a draft. */
export function writeCopy(d: Draft): void {
  d.tagline = templateTagline({ type: d.type, mode: d.mode!, city: d.city, cityName: d.cityName, themes: d.themes });
  d.summary =
    d.summary ||
    templateSummary({
      type: d.type,
      mode: d.mode!,
      organizer: d.organizer,
      city: d.city,
      cityName: d.cityName,
      themes: d.themes,
      teamMin: d.teamMin,
      teamMax: d.teamMax,
      teamSizeKnown: d.teamSizeKnown,
      fee: d.fee,
      beginnerFriendly: d.beginnerFriendly,
      basedIn: d.basedIn,
      hybridOnline: d.hybridOnline,
    });
}

/** True for a summary our template wrote (so it can be rewritten), not one a person wrote. */
export function isTemplateSummary(s: string | undefined): boolean {
  return !s || /^(An online|An in-person|A hybrid|A offline|An offline|A online) [a-z ]+?(\b by |[.,:;])/.test(s);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a instanceof Date ? a.toISOString() : a) === JSON.stringify(b instanceof Date ? b.toISOString() : b);

export interface DerivedUpdate {
  set: Record<string, unknown>;
  unset: string[];
  changed: string[];
}

/**
 * What to rewrite on an existing listing from a fresh draft of the same source event:
 * team size (and whether it is known), themes, tagline, our summary, prizes, the dates
 * (when `dates`), and a placeholder banner (replaced by a real one, or removed).
 */
export function derivedUpdate(
  doc: Pick<IHackathon, 'teamMin' | 'teamMax' | 'themes' | 'tagline' | 'summary' | 'verified' | 'prizePool' | 'prizeCurrency' | 'prizes' | 'startDate' | 'endDate' | 'registrationDeadline' | 'imageUrl' | 'sourceImageUrl'> & { teamSizeKnown?: boolean },
  d: Draft,
  opts: { dates: boolean }
): DerivedUpdate {
  const out: DerivedUpdate = { set: {}, unset: [], changed: [] };
  const put = (key: string, now: unknown, next: unknown) => {
    if (same(now, next)) return;
    out.set[key] = next;
    out.changed.push(key);
  };
  put('teamMin', doc.teamMin, d.teamMin);
  put('teamMax', doc.teamMax, d.teamMax);
  put('teamSizeKnown', doc.teamSizeKnown ?? true, d.teamSizeKnown);
  if (!doc.verified) {
    put('themes', doc.themes ?? [], d.themes);
    put('tagline', doc.tagline ?? '', d.tagline);
    if (isTemplateSummary(doc.summary)) put('summary', doc.summary ?? '', d.summary);
    put('prizePool', doc.prizePool ?? 0, d.prizePool);
    put('prizeCurrency', doc.prizeCurrency ?? 'INR', d.prizeCurrency);
    put('prizes', doc.prizes ?? [], d.prizes);
  }
  if (opts.dates && d.startDate && d.endDate && d.registrationDeadline) {
    put('startDate', doc.startDate, d.startDate);
    put('endDate', doc.endDate, d.endDate);
    put('registrationDeadline', doc.registrationDeadline, d.registrationDeadline);
  }
  if (isPlaceholderImage(doc.sourceImageUrl) || isPlaceholderImage(doc.imageUrl)) {
    if (d.imageUrl && !isPlaceholderImage(d.sourceImageUrl ?? d.imageUrl)) {
      out.set.imageUrl = d.imageUrl;
      out.set.sourceImageUrl = d.sourceImageUrl ?? d.imageUrl;
    } else out.unset.push('imageUrl', 'sourceImageUrl');
    out.changed.push('imageUrl');
  }
  return out;
}
