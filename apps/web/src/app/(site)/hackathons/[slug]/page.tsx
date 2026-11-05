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
  formatDate,
  formatDateRange,
  formatMoney,
  formatTeamSize,
  ON_OFFICIAL_PAGE,
  formatTime,
  formatWeekday,
  timeAgo,
} from '@/lib/format';
import { breadcrumbJsonLd, eventJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const found = await getHackathon(params.slug);
  if (!found) return { title: 'Hackathon not found' };
  const h = found.item;
  const where = h.mode === 'online' ? 'online' : `in ${cityName(h.city, h.cityName)}`;
  return pageMetadata({
    title: `${h.title}: ${eventTypeLabel(h.type)} ${where}`,
    description: (h.summary || `${h.title}, a ${eventTypeLabel(h.type).toLowerCase()} ${where} by ${h.organizer}. Dates, deadline, prizes, team size and how to register.`).slice(0, 300),
    path: `/hackathons/${h.slug}`,
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

export default async function HackathonDetailPage({ params }: { params: { slug: string } }) {
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
    { icon: Ticket, label: 'Entry fee', value: h.fee === 0 ? 'Free' : formatMoney(h.fee, 'INR') },
    { icon: Trophy, label: 'Prize pool', value: h.prizePool > 0 ? formatMoney(h.prizePool, h.prizeCurrency) : ON_OFFICIAL_PAGE },
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
          <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-1 text-sm text-muted">
            <Link href="/hackathons" className="shrink-0 hover:text-ink">
              Explore
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate text-ink/80" aria-current="page">{h.title}</span>
          </nav>

          <EventArt
            title={h.title}
            imageUrl={h.imageUrl}
            label={eventTypeLabel(h.type)}
            size="hero"
            eager
            className="h-52 rounded-xl border border-line sm:h-72 lg:h-80"
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Main */}
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={h.status} />
                <span className="rounded-md bg-card px-2 py-0.5 text-xs font-medium text-ink/75 ring-1 ring-inset ring-line">
                  {modeLabel(h.mode)}
                </span>
                {h.beginnerFriendly && (
                  <span className="rounded-md bg-card px-2 py-0.5 text-xs font-medium text-ink/75 ring-1 ring-inset ring-line">
                    Beginner-friendly
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl">{h.title}</h1>
              {h.tagline && <p className="mt-3 text-lg leading-7 text-muted">{h.tagline}</p>}
              <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                by <strong className="font-semibold text-ink">{h.organizer || sourceBySlug(h.sources[0])?.name || 'the organizer'}</strong>
                {h.verified && (
                  <span className="inline-flex items-center gap-1 text-ink">
                    <BadgeCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                    Verified
                  </span>
                )}
              </p>

              <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-start gap-3 bg-card p-4">
                    <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted">{f.label}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-ink">{f.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              {point && <VenueMap point={point} venue={h.venue ?? cityName(h.city, h.cityName)} destination={destination} />}

              <div className="card mt-8 p-6 sm:p-8">
                <h2 className="text-lg">About this {eventTypeLabel(h.type).toLowerCase()}</h2>
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

                <h2 className="mt-10 text-lg">Timeline</h2>
                <ol className="mt-4 space-y-5 border-l border-line pl-6">
                  {timeline.map((step) => (
                    <li key={step.label} className="relative">
                      <span className="absolute -left-[30px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-card" aria-hidden="true" />
                      <p className="text-sm font-semibold text-ink">{step.label}</p>
                      <p className="text-sm text-muted">
                        {formatWeekday(step.iso)} · {formatTime(step.iso)} IST
                      </p>
                    </li>
                  ))}
                </ol>

                {/* Scraped listings often have no prize or perk list; show only what we have. */}
                {(h.prizes.length > 0 || h.perks.length > 0) && (
                  <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    {h.prizes.length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-lg">
                          <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
                          Prizes
                        </h2>
                        <ul className="mt-3 space-y-2">
                          {h.prizes.map((p) => (
                            <li key={p} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {h.perks.length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-lg">
                          <Gift className="h-4 w-4 text-accent" aria-hidden="true" />
                          Perks
                        </h2>
                        <ul className="mt-3 space-y-2">
                          {h.perks.map((p) => (
                            <li key={p} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <LatestDiscussions hackathonSlug={h.slug} city={h.city} limit={3} title="Talk about this event" className="mt-8" />
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card p-6">
                <p className="text-xs font-medium text-muted">Registration</p>
                <p
                  className={cn(
                    'mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight',
                    h.status === 'closing-soon' ? 'text-warning dark:text-amber-300' : 'text-ink'
                  )}
                >
                  <Clock className="h-5 w-5" aria-hidden="true" />
                  {open ? deadlineLabel(h.daysToDeadline) : h.status === 'in-progress' ? 'Happening now' : 'Closed'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Deadline: {formatDate(h.registrationDeadline)}, {formatTime(h.registrationDeadline)} IST
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
                    <a href={`/go/${h.slug}`} target="_blank" rel="noopener noreferrer" className="btn-primary h-11 w-full text-[15px]">
                      Register on official site
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="btn h-11 w-full cursor-not-allowed border-line bg-ink/[0.04] text-muted">Registration closed</span>
                  )}
                  <SaveButton slug={h.slug} title={h.title} variant="full" className="w-full" />
                  <a href={googleCalendarUrl(h)} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
                    <CalendarPlus className="h-4 w-4" />
                    Add to Google Calendar
                  </a>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <p className="mb-3 text-xs font-medium text-muted">Share with your team</p>
                  <ShareButtons title={h.title} path={`/hackathons/${h.slug}`} />
                </div>

                <div className="mt-6 border-t border-line pt-5 text-sm text-muted">
                  <p className="mb-2 text-xs font-medium text-muted">Found on</p>
                  {!h.verified && <p className="mb-3 rounded-lg bg-warning-soft px-3 py-2 text-xs leading-5 text-[#78350f] dark:bg-amber-400/10 dark:text-amber-100">This listing has not been independently verified. Check the organizer page before paying or sharing personal details; report it here if it looks suspicious.</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {h.sources.map((s) => (
                      <span key={s} className="rounded-md border border-line px-2 py-0.5 text-xs font-medium text-ink/80">
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
                className="mt-3 flex items-center justify-between rounded-xl border border-line bg-card px-5 py-4 text-sm font-medium text-ink shadow-card transition-colors hover:border-ink/20"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-accent" aria-hidden="true" />
                  Need teammates for this?
                </span>
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section border-t border-line bg-card">
          <div className="container-page">
            <h2 className="mb-6 text-2xl">You might also like</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <HackathonCard key={s.slug} h={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
