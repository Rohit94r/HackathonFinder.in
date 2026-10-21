'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, MapPin, Plus, Send, UserPlus, X } from 'lucide-react';
import { SKILLS, sampleTeamPosts, type TeamPost } from '@/data/teamPosts';
import { SampleNotice } from '@/components/ui';
import { cn } from '@/lib/cn';

interface EventOption {
  slug: string;
  title: string;
}

const KEY = 'hf_team_posts_v1';
const REQUESTS_KEY = 'hf_team_requests_v1';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable; changes last for this visit only.
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = ['bg-ink', 'bg-neutral-600', 'bg-ink-700', 'bg-neutral-500', 'bg-ink-800', 'bg-neutral-700'];

export default function TeamBoard({ events }: { events: EventOption[] }) {
  const [mine, setMine] = useState<TeamPost[]>([]);
  const [requested, setRequested] = useState<string[]>([]);
  const [skill, setSkill] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setMine(load<TeamPost[]>(KEY, []));
    setRequested(load<string[]>(REQUESTS_KEY, []));
  }, []);

  const titleFor = (slug: string) => events.find((e) => e.slug === slug)?.title ?? 'Any hackathon';

  const posts = useMemo(
    () =>
      [...mine, ...sampleTeamPosts].filter(
        (p) => (!skill || p.needs.includes(skill)) && (!eventSlug || p.hackathonSlug === eventSlug)
      ),
    [mine, skill, eventSlug]
  );

  const toggleRequest = (id: string) => {
    const next = requested.includes(id) ? requested.filter((r) => r !== id) : [...requested, id];
    setRequested(next);
    store(REQUESTS_KEY, next);
  };

  const addPost = (post: TeamPost) => {
    const next = [post, ...mine];
    setMine(next);
    store(KEY, next);
    setFormOpen(false);
  };

  const deletePost = (id: string) => {
    const next = mine.filter((p) => p.id !== id);
    setMine(next);
    store(KEY, next);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="team-event">
            Hackathon
          </label>
          <select id="team-event" value={eventSlug} onChange={(e) => setEventSlug(e.target.value)} className="input py-2.5 sm:w-72">
            <option value="">All hackathons</option>
            {events.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.title}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="team-skill">
            Skill they need
          </label>
          <select id="team-skill" value={skill} onChange={(e) => setSkill(e.target.value)} className="input py-2.5 sm:w-60">
            <option value="">Teams needing any skill</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                Needs: {s}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Post a team request
        </button>
      </div>

      <SampleNotice className="mb-6">
        Preview: the posts below are samples. Your own posts and join requests are saved in this
        browser until student accounts launch.
      </SampleNotice>

      {formOpen && <PostForm events={events} onCancel={() => setFormOpen(false)} onSubmit={addPost} />}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((p, i) => {
          const isMine = mine.some((m) => m.id === p.id);
          const isRequested = requested.includes(p.id);
          return (
            <article key={p.id} className="card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white',
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  )}
                  aria-hidden="true"
                >
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {p.name} {isMine && <span className="ml-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">You</span>}
                  </p>
                  <p className="text-xs text-ink/60">{p.about}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
                    <MapPin className="h-3 w-3" />
                    {p.city} · {p.postedDaysAgo === 0 ? 'today' : `${p.postedDaysAgo}d ago`}
                  </p>
                </div>
              </div>

              <Link href={`/hackathons/${p.hackathonSlug}`} className="mt-4 text-sm font-semibold text-ink hover:underline">
                For: {titleFor(p.hackathonSlug)}
              </Link>
              <p className="mt-2 flex-1 text-sm leading-6 text-ink/80">{p.idea}</p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="w-10 font-semibold text-ink/60">Has</span>
                  {p.has.map((s) => (
                    <span key={s} className="rounded-md bg-ink/5 px-2 py-0.5 font-medium text-ink/80">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="w-10 font-semibold text-ink/60">Needs</span>
                  {p.needs.map((s) => (
                    <span key={s} className="rounded-md bg-ink/5 px-2 py-0.5 font-medium text-ink">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-ink/10 pt-4">
                {isMine ? (
                  <button type="button" onClick={() => deletePost(p.id)} className="btn-secondary w-full text-rose-600">
                    <X className="h-4 w-4" />
                    Remove my post
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleRequest(p.id)}
                    aria-pressed={isRequested}
                    className={cn('w-full', isRequested ? 'btn-secondary' : 'btn-primary')}
                  >
                    {isRequested ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isRequested ? 'Request sent' : 'Request to join'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="card p-10 text-center text-sm text-ink/70">
          No team requests match. Be the first to post one.
        </div>
      )}
    </div>
  );
}

function PostForm({
  events,
  onCancel,
  onSubmit,
}: {
  events: EventOption[];
  onCancel: () => void;
  onSubmit: (post: TeamPost) => void;
}) {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [hackathonSlug, setHackathonSlug] = useState(events[0]?.slug ?? '');
  const [has, setHas] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !idea.trim() || needs.length === 0) {
      setError('Add your name, your idea and at least one skill you need.');
      return;
    }
    onSubmit({
      id: `me-${Date.now()}`,
      name: name.trim(),
      about: about.trim() || 'Student',
      city: city.trim() || 'Online',
      hackathonSlug,
      has,
      needs,
      idea: idea.trim(),
      postedDaysAgo: 0,
    });
  };

  return (
    <form onSubmit={submit} className="card mb-8 space-y-5 p-6" aria-label="Post a team request">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Post a team request</h2>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 hover:bg-ink/5" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="tp-name">
            First name
          </label>
          <input id="tp-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>
        <div>
          <label className="label" htmlFor="tp-about">
            Year & branch
          </label>
          <input id="tp-about" className="input" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="2nd year, IT" maxLength={60} />
        </div>
        <div>
          <label className="label" htmlFor="tp-city">
            City
          </label>
          <input id="tp-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune or Online" maxLength={40} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="tp-event">
          Hackathon
        </label>
        <select id="tp-event" className="input" value={hackathonSlug} onChange={(e) => setHackathonSlug(e.target.value)}>
          {events.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.title}
            </option>
          ))}
        </select>
      </div>
      {[
        { label: 'Skills you have', list: has, set: setHas },
        { label: 'Skills you need', list: needs, set: setNeeds },
      ].map((group) => (
        <fieldset key={group.label}>
          <legend className="label">{group.label}</legend>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={group.list.includes(s)}
                onClick={() => toggle(group.list, group.set, s)}
                className={cn('chip text-xs', group.list.includes(s) && 'chip-active')}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <div>
        <label className="label" htmlFor="tp-idea">
          Your idea in two lines
        </label>
        <textarea id="tp-idea" className="input min-h-[90px]" value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={280} />
      </div>
      {error && (
        <p className="text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          <Send className="h-4 w-4" />
          Post request
        </button>
      </div>
    </form>
  );
}
