import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock,
  ExternalLink,
  Gift,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import {
  cityName,
  eligibilityLabel,
  eventPoint,
  eventTypeLabel,
  isRegistrationOpen,
  modeLabel,
  sourceBySlug,
  themeName,
} from '@hackathonfinder/shared';
import LatestDiscussions from '@/components/community/LatestDiscussions';
import EventArt from '@/components/hackathon/EventArt';
import LocalTime from '@/components/LocalTime';
import DistanceTag from '@/components/hackathon/DistanceTag';
import MobileRegisterBar from '@/components/hackathon/MobileRegisterBar';
import HackathonCard from '@/components/hackathon/HackathonCard';
import ReportListing from '@/components/hackathon/ReportListing';
import SaveButton from '@/components/hackathon/SaveButton';
import ShareButtons from '@/components/hackathon/ShareButtons';
import StatusBadge from '@/components/hackathon/StatusBadge';
import VenueMap from '@/components/hackathon/VenueMap';
import { similarTo, type HackathonView } from '@/lib/hackathons';
import { countView, getHackathon } from '@/server/hackathons';
import {
  deadlineLabel,
  formatDateRange,
  formatDay,
  formatTeamSize,
  ON_OFFICIAL_PAGE,
  timeAgo,
} from '@/lib/format';
import Money from '@/components/Money';
import { breadcrumbJsonLd, eventJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { themeStyle } from '@/lib/themeStyles';
import { ticketNo } from '@/lib/stations';
import { cn } from '@/lib/cn';
import { Barcode } from '@/components/junction/Signs';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const found = await getHackathon(params.slug);
  if (!found) return { title: 'Hackathon not found' };
  const h = found.item;
  const where = h.mode === 'online' ? 'online' : `in ${cityName(h.city, h.cityName)}`;
  const raw = h.title.trim();
  const clipped = raw.length > 60 ? `${raw.slice(0, 57).replace(/[\s\-–—:|,]+$/, '')}…` : raw;
  const full = `${clipped}: ${eventTypeLabel(h.type)} ${where}`;
  const place = `${clipped}: ${where}`;
  // Two listings can share a title (a rerun, or the same event scraped twice). Add the start
  // date so the two pages don't compete with an identical title in search results.
  const duplicate = found.items.some((x) => x.slug !== h.slug && x.title === h.title);
  const dated = `${clipped} (${formatDay(h.startDate)})`;
  const candidates = duplicate ? [dated, full, place, clipped] : [full, place, dated, clipped];
  // Keep the useful words inside the ~60-character cut.
  const title = candidates.find((t) => t.length <= 60) ?? clipped;
  // The same event is sometimes listed twice from two scrape runs. Point both pages at the
  // shortest slug so search engines treat them as one event.
  const canonicalSlug = h.registrationUrl
    ? found.items
        .filter((x) => x.registrationUrl === h.registrationUrl)
        .map((x) => x.slug)
        .sort((a, b) => a.length - b.length)[0] ?? h.slug
    : h.slug;
  const lead = (h.summary || `${h.title} is a ${eventTypeLabel(h.type).toLowerCase()} ${where} by ${h.organizer}.`).trim();
  const description = lead.length < 110 ? `${lead} Dates, registration deadline, prizes, team size and how to register.` : lead;
  return pageMetadata({
    title,
    description,
    path: `/hackathons/${canonicalSlug}`,
    keywords: [h.title, `${h.title} registration`, `hackathon ${where}`, ...h.themes.map((t) => `${themeName(t)} hackathon`)],
    image: h.imageUrl,
    // Finished events stay reachable but drop out of search results.
    noindex: h.status === 'completed',
  });
}

function googleCalendarUrl(h: HackathonView): string {
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: h.title,
    dates: `${fmt(h.startDate)}/${fmt(h.endDate)}`,
    details: `${h.summary}\n\nRegister: ${h.registrationUrl}`,
    location: h.mode === 'online' ? 'Online' : h.venue ?? cityName(h.city, h.cityName),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function HackathonDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const found = await getHackathon(params.slug);
  if (!found) notFound();
  const { item: h, items, nowIso } = found;
  countView(h.slug);
  const open = isRegistrationOpen(h.status);
  const similar = similarTo(h, items);
  const location = h.mode === 'online' ? 'Online' : `${h.venue ?? cityName(h.city, h.cityName)}${h.mode === 'hybrid' ? ' (hybrid)' : ''}`;
  const point = eventPoint(h);
  const destination = h.lat !== undefined && h.lng !== undefined ? `${h.lat},${h.lng}` : h.venue ?? cityName(h.city, h.cityName);

  const facts = [
    { icon: CalendarDays, label: 'When', value: formatDateRange(h.startDate, h.endDate) },
    { icon: MapPin, label: 'Where', value: location },
    { icon: Users, label: 'Team', value: h.teamSizeKnown === false ? ON_OFFICIAL_PAGE : formatTeamSize(h.teamMin, h.teamMax) },
    { icon: Ticket, label: 'Entry fee', value: h.fee === 0 ? 'Free' : <Money amount={h.fee} currency="INR" full /> },
    { icon: Trophy, label: 'Prize pool', value: h.prizePool > 0 ? <Money amount={h.prizePool} currency={h.prizeCurrency} full /> : ON_OFFICIAL_PAGE },
    { icon: ShieldCheck, label: 'Who can join', value: h.eligibility.map(eligibilityLabel).join(', ') },
  ];

  const timeline = [
    { label: 'Registration closes', iso: h.registrationDeadline },
    { label: 'Event starts', iso: h.startDate },
    { label: 'Event ends', iso: h.endDate },
  ];

  const jsonLd = [
    eventJsonLd(h),
    breadcrumbJsonLd([
      { name: 'Hackathons', path: '/hackathons' },
      ...(h.city && h.mode !== 'online' ? [{ name: cityName(h.city, h.cityName), path: `/cities/${h.city}` }] : []),
      { name: h.title, path: `/hackathons/${h.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="bg-surface">
        <div className="container-page pb-14 pt-6">
          <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <Link href="/hackathons" className="shrink-0 hover:text-ink">
              All departures
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate text-ink/80" aria-current="page">{h.title}</span>
          </nav>

          {/* The boarding pass: cover and title, with the journey on the stub. */}
          <div className="ticket ticket-h [--notch:12px] [--stub:150px] sm:[--stub:104px]">
            <div className="ticket-paper">
              <div className="grid lg:grid-cols-[1.25fr_1fr]">
                <EventArt
                  title={h.title}
                  imageUrl={h.imageUrl}
                  label={eventTypeLabel(h.type)}
                  size="hero"
                  eager
                  className="h-52 sm:h-72 lg:h-full lg:min-h-[340px]"
                />
                <div className="flex min-w-0 flex-col p-6 sm:p-8">
                  <p className="flex items-center justify-between gap-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted">
                    <span>Boarding pass · {eventTypeLabel(h.type)}</span>
                    <span aria-hidden="true">No. {ticketNo(h.slug)}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.status} />
                    <span className="rounded-[4px] border border-ink/20 px-2 py-[3px] font-display text-[12.5px] font-bold uppercase leading-none tracking-[0.07em] text-ink/75">
                      {modeLabel(h.mode)}
                    </span>
                    {h.beginnerFriendly && (
                      <span className="rounded-[4px] border border-ink/20 px-2 py-[3px] font-display text-[12.5px] font-bold uppercase leading-none tracking-[0.07em] text-ink/75">
                        Beginner-friendly
                      </span>
                    )}
                  </div>
                  <h1 className="mt-4 text-[2.4rem] sm:text-[3.2rem] lg:text-[3.4rem]">{h.title}</h1>
                  {h.tagline && <p className="mt-3 text-lg leading-7 text-muted">{h.tagline}</p>}
                  <p className="mt-auto flex flex-wrap items-center gap-1.5 pt-5 text-sm text-muted">
                    by <strong className="font-semibold text-ink">{h.organizer || sourceBySlug(h.sources[0])?.name || 'the organizer'}</strong>
                    {h.verified && (
                      <span className="inline-flex items-center gap-1 text-ink">
                        <BadgeCheck className="h-4 w-4 text-accent dark:text-board" aria-hidden="true" />
                        Verified
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <dl className="ticket-stub grid grid-cols-2 content-center gap-x-6 gap-y-3 px-6 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto] sm:items-center sm:px-8">
                {[
                  { k: 'Board by', v: formatDay(h.registrationDeadline), sub: open ? deadlineLabel(h.daysToDeadline) : 'Registration closed' },
                  { k: 'Journey', v: formatDay(h.startDate), sub: formatDateRange(h.startDate, h.endDate) },
                  {
                    k: 'City',
                    v: h.mode === 'online' ? 'Online' : cityName(h.city, h.cityName),
                    sub: h.mode === 'online' ? 'Join from anywhere' : <DistanceTag h={h} variant="stub" fallback={modeLabel(h.mode)} />,
                  },
                  { k: 'Fare', v: h.fee === 0 ? 'Free' : <Money amount={h.fee} currency="INR" compact />, sub: 'Entry fee' },
                ].map((x) => (
                  <div key={x.k} className="min-w-0">
                    <dt className="font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-muted">{x.k}</dt>
                    <dd className="mt-1 truncate font-display text-[24px] font-bold uppercase leading-none text-ink sm:text-[28px]">{x.v}</dd>
                    <dd className="mt-0.5 truncate text-xs text-muted">{x.sub}</dd>
                  </div>
                ))}
                <Barcode seed={h.slug} className="hidden h-12 text-ink/75 sm:flex" />
              </dl>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Main */}
            <div className="min-w-0">
              <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-start gap-3 bg-card p-4">
                    <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{f.label}</dt>
                      <dd className="mt-1 text-[15px] font-semibold text-ink">{f.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              {point && <VenueMap point={point} venue={h.venue ?? cityName(h.city, h.cityName)} destination={destination} />}

              <div className="card mt-8 p-6 sm:p-8">
                <h2 className="text-[28px]">About this {eventTypeLabel(h.type).toLowerCase()}</h2>
                {h.summary && <p className="mt-3 whitespace-pre-line leading-7 text-ink/80">{h.summary}</p>}

                {h.themes.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {h.themes.map((t) => {
                      const style = themeStyle(t);
                      return (
                        <Link
                          key={t}
                          href={`/themes/${t}`}
                          className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-opacity hover:opacity-80', style.soft)}
                        >
                          <style.icon className="h-4 w-4" />
                          {themeName(t)}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* The route map: each date is a stop on the line. */}
                <h2 className="mt-10 text-[28px]">Route</h2>
                <ol className="ml-1.5 mt-5 space-y-6 border-l-[3px] border-dashed border-ink/25 pl-7">
                  {timeline.map((step) => (
                    <li key={step.label} className="relative">
                      <span className="absolute -left-[38px] top-0.5 h-4 w-4 rounded-full border-[3px] border-navy bg-board" aria-hidden="true" />
                      <p className="font-display text-[19px] font-bold uppercase leading-tight tracking-[0.03em] text-ink">{step.label}</p>
                      <p className="text-sm text-muted">
                        <LocalTime iso={step.iso} />
                      </p>
                    </li>
                  ))}
                </ol>

                {/* Scraped listings often have no prize or perk list; show only what we have. */}
                {(h.prizes.length > 0 || h.perks.length > 0) && (
                  <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    {h.prizes.length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-[24px]">
                          <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
                          Prizes
                        </h2>
                        <ul className="mt-3 space-y-2">
                          {h.prizes.map((p) => (
                            <li key={p} className="rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {h.perks.length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-[24px]">
                          <Gift className="h-4 w-4 text-accent" aria-hidden="true" />
                          Perks
                        </h2>
                        <ul className="mt-3 space-y-2">
                          {h.perks.map((p) => (
                            <li key={p} className="rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card mt-8 p-6 sm:p-8">
                <h2 className="text-[28px]">Before you register</h2>
                <p className="mt-2 leading-7 text-ink/75">
                  Three things worth doing before the deadline: check what the registration actually asks for, line up a
                  team if the event allows one, and decide what a finished demo looks like.
                </p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { href: '/blog/checklist-before-you-register', label: 'Registration checklist' },
                    { href: '/teams', label: 'Find a team' },
                    h.themes.includes('ai-ml')
                      ? { href: '/news/choosing-an-ai-model', label: 'Choose an AI model' }
                      : { href: '/blog/pitch-your-project-in-three-minutes', label: 'Pitch in 3 minutes' },
                  ].map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="flex h-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink"
                      >
                        {l.label}
                        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <LatestDiscussions hackathonSlug={h.slug} city={h.city} limit={3} title="Talk about this event" className="mt-8" />
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card overflow-hidden p-6">
                <p className="eyebrow">Registration</p>
                <p
                  className={cn(
                    'mt-2 flex items-center gap-2 font-display text-[30px] font-bold uppercase leading-none',
                    h.status === 'closing-soon' ? 'text-accent dark:text-board' : 'text-ink'
                  )}
                >
                  <Clock className="h-5 w-5" aria-hidden="true" />
                  {open ? deadlineLabel(h.daysToDeadline) : h.status === 'in-progress' ? 'Happening now' : 'Closed'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Deadline: <LocalTime iso={h.registrationDeadline} year />
                </p>

                {h.registrationVia === 'qr' && (
                  <p className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink/80">
                    <QrCode className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {h.title} takes registrations through a QR code on its poster. The button opens the page it points to, or the
                      organizer&rsquo;s post with the poster.
                    </span>
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2.5">
                  {open ? (
                    <a href={`/go/${h.slug}`} target="_blank" rel="noopener noreferrer" className="btn-primary h-12 w-full text-[16px]">
                      Register on official site
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="btn h-12 w-full cursor-not-allowed border-line bg-ink/[0.04] text-muted">Registration closed</span>
                  )}
                  <SaveButton slug={h.slug} title={h.title} variant="full" className="w-full" />
                  <a href={googleCalendarUrl(h)} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
                    <CalendarPlus className="h-4 w-4" />
                    Add to Google Calendar
                  </a>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <p className="eyebrow mb-3">Share with your team</p>
                  <ShareButtons title={h.title} path={`/hackathons/${h.slug}`} />
                </div>

                <div className="mt-6 border-t border-line pt-5 text-sm text-muted">
                  <p className="eyebrow mb-2">Found on</p>
                  {!h.verified && <p className="mb-3 rounded-lg bg-warning-soft px-3 py-2 text-xs leading-5 text-[#78350f] dark:bg-amber-400/10 dark:text-amber-100">This listing has not been independently verified. Check the organizer page before paying or sharing personal details; report it here if it looks suspicious.</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {h.sources.map((s) => (
                      <span key={s} className="rounded-[4px] border border-ink/20 px-2 py-0.5 font-display text-[13px] font-semibold uppercase tracking-[0.05em] text-ink/80">
                        {sourceBySlug(s)?.name ?? s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">Last checked {timeAgo(h.lastChecked, nowIso)}</p>
                  <ReportListing slug={h.slug} />
                </div>
              </div>

              <Link
                href={`/teams?hackathon=${h.slug}`}
                className="station-board mt-4 flex items-center justify-between px-5 py-4 font-display text-[17px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-5 w-5" aria-hidden="true" />
                  Need teammates for this?
                </span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section border-t border-line bg-card/60">
          <div className="container-page">
            <p className="eyebrow mb-3">Connecting trains</p>
            <h2 className="mb-8 text-[2.4rem]">You might also like</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <HackathonCard key={s.slug} h={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      <MobileRegisterBar
        slug={h.slug}
        title={h.title}
        open={open}
        when={open ? deadlineLabel(h.daysToDeadline) : h.status === 'in-progress' ? 'Happening now' : 'Registration closed'}
        deadline={formatDay(h.registrationDeadline)}
        hurry={h.status === 'closing-soon'}
      />
    </>
  );
}
