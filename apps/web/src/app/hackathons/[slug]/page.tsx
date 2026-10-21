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
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import {
  cityName,
  eligibilityLabel,
  eventTypeLabel,
  isRegistrationOpen,
  modeLabel,
  sourceBySlug,
  themeName,
} from '@hackathonfinder/shared';
import EventArt from '@/components/hackathon/EventArt';
import HackathonCard from '@/components/hackathon/HackathonCard';
import SaveButton from '@/components/hackathon/SaveButton';
import ShareButtons from '@/components/hackathon/ShareButtons';
import StatusBadge from '@/components/hackathon/StatusBadge';
import { SampleNotice } from '@/components/ui';
import { getHackathon, similarTo, type HackathonView } from '@/lib/hackathons';
import {
  deadlineLabel,
  formatDate,
  formatDateRange,
  formatMoney,
  formatTeamSize,
  formatTime,
  formatWeekday,
  timeAgo,
} from '@/lib/format';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const found = getHackathon(params.slug);
  if (!found) return { title: 'Hackathon not found' };
  const h = found.item;
  return {
    title: `${h.title}: ${eventTypeLabel(h.type)} ${h.mode === 'online' ? 'online' : `in ${cityName(h.city)}`}`,
    description: h.summary,
  };
}

function googleCalendarUrl(h: HackathonView): string {
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: h.title,
    dates: `${fmt(h.startDate)}/${fmt(h.endDate)}`,
    details: `${h.summary}\n\nRegister: ${h.registrationUrl}`,
    location: h.mode === 'online' ? 'Online' : h.venue ?? cityName(h.city),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function HackathonDetailPage({ params }: { params: { slug: string } }) {
  const found = getHackathon(params.slug);
  if (!found) notFound();
  const { item: h, items, nowIso } = found;
  const open = isRegistrationOpen(h.status);
  const similar = similarTo(h, items);
  const location = h.mode === 'online' ? 'Online' : `${h.venue ?? cityName(h.city)}${h.mode === 'hybrid' ? ' (hybrid)' : ''}`;

  const facts = [
    { icon: CalendarDays, label: 'When', value: formatDateRange(h.startDate, h.endDate) },
    { icon: MapPin, label: 'Where', value: location },
    { icon: Users, label: 'Team', value: formatTeamSize(h.teamMin, h.teamMax) },
    { icon: Ticket, label: 'Entry fee', value: h.fee === 0 ? 'Free' : formatMoney(h.fee, 'INR') },
    { icon: Trophy, label: 'Prize pool', value: h.prizePool > 0 ? formatMoney(h.prizePool, h.prizeCurrency) : 'Swag & certificates' },
    { icon: ShieldCheck, label: 'Who can join', value: h.eligibility.map(eligibilityLabel).join(', ') },
  ];

  const timeline = [
    { label: 'Registration closes', iso: h.registrationDeadline },
    { label: 'Event starts', iso: h.startDate },
    { label: 'Event ends', iso: h.endDate },
  ];

  return (
    <>
      <section className="bg-surface">
        <div className="container-page pb-10 pt-6">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-ink/60">
            <Link href="/hackathons" className="hover:underline">
              Explore
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="truncate text-ink/80">{h.title}</span>
          </nav>

          <EventArt
            theme={h.themes[0]}
            title={h.title}
            label={eventTypeLabel(h.type)}
            size="hero"
            className="h-48 rounded-3xl sm:h-64"
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Main */}
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={h.status} />
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 ring-1 ring-ink/15">
                  {modeLabel(h.mode)}
                </span>
                {h.beginnerFriendly && (
                  <span className="rounded-full bg-lime-soft px-2.5 py-1 text-xs font-semibold text-ink">
                    Beginner-friendly
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{h.title}</h1>
              <p className="mt-3 text-lg text-ink/70">{h.tagline}</p>
              <p className="mt-4 flex items-center gap-1.5 text-sm text-ink/70">
                by <strong className="font-semibold text-ink">{h.organizer}</strong>
                {h.verified && (
                  <span className="inline-flex items-center gap-1 text-ink">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </span>
                )}
              </p>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label} className="card flex items-start gap-3 p-4">
                    <span className="rounded-xl bg-ink/5 p-2 text-ink">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wider text-ink/60">{f.label}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-ink">{f.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="card mt-8 p-6 sm:p-8">
                <h2 className="text-xl font-bold">About this {eventTypeLabel(h.type).toLowerCase()}</h2>
                <p className="mt-3 leading-7 text-ink/80">{h.summary}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {h.themes.map((t) => {
                    const style = themeStyle(t);
                    return (
                      <Link
                        key={t}
                        href={`/themes/${t}`}
                        className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium', style.soft)}
                      >
                        <style.icon className="h-4 w-4" />
                        {themeName(t)}
                      </Link>
                    );
                  })}
                </div>

                <h2 className="mt-10 text-xl font-bold">Timeline</h2>
                <ol className="mt-4 space-y-4 border-l-2 border-ink/15 pl-6">
                  {timeline.map((step) => (
                    <li key={step.label} className="relative">
                      <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-white bg-ink ring-1 ring-ink/20" />
                      <p className="text-sm font-semibold text-ink">{step.label}</p>
                      <p className="text-sm text-ink/70">
                        {formatWeekday(step.iso)} · {formatTime(step.iso)} IST
                      </p>
                    </li>
                  ))}
                </ol>

                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                      <Trophy className="h-5 w-5 text-ink" />
                      Prizes
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {h.prizes.map((p) => (
                        <li key={p} className="rounded-xl bg-ink/5 px-4 py-2.5 text-sm font-medium text-ink">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                      <Gift className="h-5 w-5 text-ink" />
                      Perks
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {h.perks.map((p) => (
                        <li key={p} className="rounded-xl bg-ink/5 px-4 py-2.5 text-sm font-medium text-ink">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <SampleNotice className="mt-6">
                This is a sample listing for the preview. The register button opens the source
                platform’s homepage.
              </SampleNotice>
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Registration</p>
                <p
                  className={cn(
                    'mt-1 flex items-center gap-2 font-display text-2xl font-bold',
                    'text-ink'
                  )}
                >
                  <Clock className="h-6 w-6" />
                  {open ? deadlineLabel(h.daysToDeadline) : h.status === 'in-progress' ? 'Happening now' : 'Closed'}
                </p>
                <p className="mt-1 text-sm text-ink/70">
                  Deadline: {formatDate(h.registrationDeadline)}, {formatTime(h.registrationDeadline)} IST
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  {open ? (
                    <a href={h.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full py-3.5 text-base">
                      Register on official site
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="btn w-full cursor-not-allowed bg-ink/5 text-ink/60">Registration closed</span>
                  )}
                  <SaveButton slug={h.slug} title={h.title} variant="full" className="w-full" />
                  <a href={googleCalendarUrl(h)} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
                    <CalendarPlus className="h-4 w-4" />
                    Add to Google Calendar
                  </a>
                </div>

                <div className="mt-6 border-t border-ink/10 pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">Share with your team</p>
                  <ShareButtons title={h.title} path={`/hackathons/${h.slug}`} />
                </div>

                <div className="mt-6 border-t border-ink/10 pt-5 text-sm text-ink/70">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/60">Found on</p>
                  <div className="flex flex-wrap gap-1.5">
                    {h.sources.map((s) => (
                      <span key={s} className="rounded-md bg-ink/5 px-2 py-1 text-xs font-medium text-ink/80">
                        {sourceBySlug(s)?.name ?? s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-ink/60">Last checked {timeAgo(h.lastChecked, nowIso)}</p>
                </div>
              </div>

              <Link
                href="/teams"
                className="mt-4 flex items-center justify-between rounded-2xl bg-ink px-5 py-4 text-sm font-semibold text-white transition hover:bg-ink-700"
              >
                Need teammates for this?
                <ChevronRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section pt-12">
          <div className="container-page">
            <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
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
