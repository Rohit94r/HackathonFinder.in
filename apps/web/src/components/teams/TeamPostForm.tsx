'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send, X } from 'lucide-react';
import { CITIES, cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import { SKILLS, TEAM_MODES, type TeamMode } from '@/data/teamPosts';
import { ApiClientError } from '@/lib/apiClient';
import { useMe } from '@/lib/useMe';
import type { MyProfile } from '@/lib/useProfile';
import { cn } from '@/lib/cn';
import type { TeamEvent } from './teamUtils';

type ErrorKey = 'hackathon' | 'city' | 'members' | 'teamMax' | 'needs' | 'idea';
type Errors = Partial<Record<ErrorKey | 'form', string>>;

/** Body for POST /api/team-posts. */
export interface NewTeamPostInput {
  /** '' for a team open to any hackathon. */
  hackathonSlug: string;
  city: string;
  mode: TeamMode;
  members: number;
  teamMax: number;
  has: string[];
  needs: string[];
  idea: string;
}

interface TeamPostFormProps {
  events: TeamEvent[];
  /** The signed-in student; the form only opens for them. */
  profile: MyProfile;
  defaultHackathon?: string;
  onCancel: () => void;
  onSubmit: (post: NewTeamPostInput) => Promise<void>;
}

const IDEA_MIN = 20;
const IDEA_MAX = 500;
/** Team size limit when the post isn't for a particular listing. */
const ANY_MAX = 6;

// The API names fields after the body; the form names them after its inputs.
const FIELD_KEYS: Record<string, ErrorKey> = {
  hackathonSlug: 'hackathon',
  city: 'city',
  members: 'members',
  teamMax: 'teamMax',
  needs: 'needs',
  idea: 'idea',
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function TeamPostForm({ events, profile, defaultHackathon, onCancel, onSubmit }: TeamPostFormProps) {
  const { me } = useMe();
  // A hackathon picked in the filters, otherwise "any hackathon".
  const first = events.find((e) => e.slug === defaultHackathon);
  const [hackathonSlug, setHackathonSlug] = useState(first?.slug ?? '');
  const [city, setCity] = useState(first?.mode === 'online' ? 'online' : profile.city);
  const [mode, setMode] = useState<TeamMode>(first?.mode === 'online' ? 'online' : 'in-person');
  const [teamMax, setTeamMax] = useState(Math.min(first?.teamMax ?? 4, 4));
  const [members, setMembers] = useState(1);
  const [has, setHas] = useState<string[]>(profile.skills.filter((s) => SKILLS.includes(s)));
  const [needs, setNeeds] = useState<string[]>([]);
  const [idea, setIdea] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const event = events.find((e) => e.slug === hackathonSlug);
  const eventMax = Math.max(2, event?.teamMax ?? ANY_MAX);

  const pickEvent = (slug: string) => {
    setHackathonSlug(slug);
    const next = events.find((e) => e.slug === slug);
    const max = Math.max(2, Math.min(teamMax, next?.teamMax ?? ANY_MAX));
    setTeamMax(max);
    setMembers((m) => Math.min(m, max - 1));
    if (next?.mode === 'online') setMode('online');
  };

  const focusFirst = (found: Errors) => {
    const key = (Object.keys(found) as (keyof Errors)[]).find((k) => k !== 'form');
    if (key) document.getElementById(`tp-${key}`)?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (hackathonSlug && !event) found.hackathon = 'That hackathon isn’t open any more. Pick another, or any hackathon.';
    if (!city) found.city = 'Pick where your team works from.';
    if (needs.length === 0) found.needs = 'Pick at least one skill you need.';
    if (idea.trim().length < IDEA_MIN) found.idea = `Tell people your idea in a line or two (at least ${IDEA_MIN} characters).`;
    setErrors(found);
    if (Object.keys(found).length) return focusFirst(found);

    setBusy(true);
    try {
      await onSubmit({
        hackathonSlug,
        city,
        mode: city === 'online' ? 'online' : mode,
        members,
        teamMax,
        has,
        needs,
        idea: idea.trim(),
      });
    } catch (err) {
      const fromServer: Errors = { form: err instanceof Error ? err.message : 'Something went wrong. Please try again.' };
      if (err instanceof ApiClientError && err.fields) {
        for (const [field, msg] of Object.entries(err.fields)) {
          const key = FIELD_KEYS[field.split('.')[0]];
          if (key && !fromServer[key]) fromServer[key] = msg;
        }
      }
      setErrors(fromServer);
      focusFirst(fromServer);
    } finally {
      setBusy(false);
    }
  };

  const errorText = (key: keyof Errors) =>
    errors[key] && (
      <p id={`tp-${key}-error`} className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">
        {errors[key]}
      </p>
    );
  const invalid = (key: ErrorKey) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `tp-${key}-error` : undefined,
  });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="card mb-8 scroll-mt-24 space-y-6 p-5 sm:p-7" aria-labelledby="tp-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="tp-title" className="font-sans text-xl font-bold normal-case tracking-normal">
            Post your team
          </h2>
          <p className="mt-1 text-sm text-ink/70">Say what you’re building and who you need. Students who match can ask to join.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 hover:bg-ink/5" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-ink/5 px-4 py-3">
        <Avatar name={profile.name} image={me?.image} size="sm" />
        <p className="min-w-0 flex-1 text-sm text-ink/80">
          Posting as <strong className="text-ink">{profile.name}</strong>
          {profile.city && <> · {cityName(profile.city)}</>}
        </p>
        <Link href="/profile" className="shrink-0 text-xs font-semibold text-ink underline underline-offset-2">
          Edit profile
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tp-hackathon">
            Hackathon
          </label>
          <select
            id="tp-hackathon"
            className={cn('input', errors.hackathon && 'border-brand-500')}
            value={hackathonSlug}
            onChange={(e) => pickEvent(e.target.value)}
            {...invalid('hackathon')}
          >
            <option value="">Any upcoming hackathon</option>
            {events.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.title}
              </option>
            ))}
          </select>
          {errorText('hackathon')}
        </div>
        <div>
          <label className="label" htmlFor="tp-city">
            Where your team works from
          </label>
          <select
            id="tp-city"
            className={cn('input', errors.city && 'border-brand-500')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            {...invalid('city')}
          >
            {!city && <option value="">Pick a city</option>}
            <option value="online">Online, no home city</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          {errorText('city')}
        </div>
      </div>

      <fieldset>
        <legend className="label">How you’ll work</legend>
        <div className="flex flex-wrap gap-2">
          {TEAM_MODES.map((m) => {
            const active = (city === 'online' ? 'online' : mode) === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={active}
                disabled={city === 'online' && m.value !== 'online'}
                onClick={() => setMode(m.value)}
                className={cn('chip text-xs disabled:opacity-50', active && 'chip-active')}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="tp-members">
            People in your team now
          </label>
          <select id="tp-members" className="input" value={members} onChange={(e) => setMembers(Number(e.target.value))} {...invalid('members')}>
            {Array.from({ length: teamMax - 1 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? 'Just me' : `${n}, with me`}
              </option>
            ))}
          </select>
          {errorText('members')}
        </div>
        <div>
          <label className="label" htmlFor="tp-teamMax">
            Team size you want
          </label>
          <select
            id="tp-teamMax"
            className="input"
            value={teamMax}
            onChange={(e) => {
              const max = Number(e.target.value);
              setTeamMax(max);
              setMembers((m) => Math.min(m, max - 1));
            }}
            {...invalid('teamMax')}
          >
            {Array.from({ length: eventMax - 1 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n} people
              </option>
            ))}
          </select>
          {errorText('teamMax')}
        </div>
      </div>

      {[
        { key: 'has' as const, label: 'Skills your team has', list: has, set: setHas },
        { key: 'needs' as const, label: 'Skills you need', list: needs, set: setNeeds },
      ].map((group) => (
        <fieldset key={group.key} id={group.key === 'needs' ? 'tp-needs' : undefined} tabIndex={-1} className="outline-none">
          <legend className="label">{group.label}</legend>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={group.list.includes(s)}
                onClick={() => group.set(toggle(group.list, s))}
                className={cn('chip text-xs', group.list.includes(s) && 'chip-active')}
              >
                {s}
              </button>
            ))}
          </div>
          {group.key === 'needs' && errorText('needs')}
        </fieldset>
      ))}

      <div>
        <label className="label" htmlFor="tp-idea">
          Your idea in two lines
        </label>
        <textarea
          id="tp-idea"
          className={cn('input min-h-[96px]', errors.idea && 'border-brand-500')}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          maxLength={IDEA_MAX}
          placeholder="What you’re building, and what’s done so far"
          {...invalid('idea')}
        />
        <div className="mt-1 flex justify-between gap-3">
          {errorText('idea') || <span />}
          <span className="text-xs text-ink/50">
            {idea.length}/{IDEA_MAX}
          </span>
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-brand-800 dark:text-brand-200">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          <Send className="h-4 w-4" />
          {busy ? 'Posting…' : 'Post team'}
        </button>
      </div>
    </form>
  );
}
