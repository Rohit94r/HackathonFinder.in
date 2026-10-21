'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Trophy, Users } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { formatDateRange, formatPrizeShort, formatTeamSize } from '@/lib/format';
import EventArt from './EventArt';

export default function FeaturedSlider({ items }: { items: HackathonView[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;
  const h = items[index];
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div>
      <div className="grid items-center gap-10 lg:grid-cols-2" aria-live="polite">
        <EventArt theme={h.themes[0]} title={h.title} size="hero" className="h-72 rounded-[20px] sm:h-[420px]" />
        <div>
          <span className="eyebrow mb-5">Featured hackathon</span>
          <h2 className="text-5xl sm:text-6xl">{h.title}</h2>
          <p className="mt-6 text-xl leading-8 text-ink/80">“{h.summary}”</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm font-medium text-ink/80">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ink" />
              {h.mode === 'online' ? 'Online' : cityName(h.city)}
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-ink" />
              {formatDateRange(h.startDate, h.endDate)}
            </li>
            <li className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-ink" />
              {formatPrizeShort(h.prizePool, h.prizeCurrency)}
            </li>
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-ink" />
              {formatTeamSize(h.teamMin, h.teamMax)}
            </li>
          </ul>
          <p className="mt-6 text-sm text-ink/60">by {h.organizer}</p>
          <Link href={`/hackathons/${h.slug}`} className="btn-primary mt-6">
            See details
          </Link>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous hackathon"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface hover:bg-ink-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {items.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${item.title}`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-ink' : 'w-2.5 bg-ink/25'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next hackathon"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface hover:bg-ink-700"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
