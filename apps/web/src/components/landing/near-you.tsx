'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Compass, MapPin, Navigation, Sparkles } from 'lucide-react';
import { PHOTOS } from './photos';
import { cn } from '@/lib/cn';

export interface CityCount {
  slug: string;
  name: string;
  open: number;
}

interface NearYouSectionProps {
  cities: CityCount[];
  totalCities: number;
}

export function NearYouSection({ cities, totalCities }: NearYouSectionProps) {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
      <div className="container-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-semibold text-accent border border-red-200/60 dark:border-red-900/30 mb-3">
              <MapPin className="h-3.5 w-3.5" />
              <span>Nationwide Ecosystem</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Hackathons Near You
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-zinc-400 max-w-2xl">
              Connect with fellow developers in person. Explore hackathons happening on college campuses, tech hubs,
              and coworking spaces across India.
            </p>
          </div>

          <Link
            href="/near-me"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark transition self-start md:self-auto"
          >
            <Navigation className="h-4 w-4" />
            <span>Use My Current Location</span>
          </Link>
        </div>

        {/* City Hubs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/cities/${city.slug}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 p-5 transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-accent transition group-hover:bg-accent group-hover:text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 group-hover:bg-red-50 group-hover:text-accent transition">
                  {city.open} {city.open === 1 ? 'event' : 'events'}
                </span>
              </div>

              <div className="mt-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-accent transition">
                  {city.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">View college &amp; tech fests</p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Explore city</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* Community Campus Banner with photo backdrop */}
        <div className="mt-12 relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 p-8 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                <Sparkles className="h-3.5 w-3.5" /> For Campus Clubs &amp; Organizers
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3">
                Organizing a College Hackathon?
              </h3>
              <p className="mt-3 text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                List your hackathon on HackathonFinder for free. Get discovered by 15,000+ active student developers,
                designers, and problem solvers across colleges in India.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark transition"
                >
                  Post Your Hackathon Free
                </Link>
                <Link
                  href="/organizers"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:border-slate-400 transition"
                >
                  Organizer Features
                </Link>
              </div>
            </div>

            <div className="md:col-span-5 relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-inner">
              <Image
                src={PHOTOS.expoHall.src}
                alt="Hackathon expo hall"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-red-200">Campus Visibility</p>
                <p className="text-sm font-bold">100% Free distribution for student-led events</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
