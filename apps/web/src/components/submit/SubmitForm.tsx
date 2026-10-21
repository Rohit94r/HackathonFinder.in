'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Send } from 'lucide-react';
import { CITIES, ELIGIBILITY, EVENT_TYPES, MODES, THEMES, type ThemeSlug } from '@hackathonfinder/shared';
import { cn } from '@/lib/cn';

interface FormState {
  title: string;
  organizer: string;
  email: string;
  type: string;
  mode: string;
  city: string;
  venue: string;
  start: string;
  end: string;
  deadline: string;
  teamMin: string;
  teamMax: string;
  fee: string;
  prize: string;
  eligibility: string;
  themes: ThemeSlug[];
  url: string;
  description: string;
  isOrganizer: boolean;
}

const EMPTY: FormState = {
  title: '',
  organizer: '',
  email: '',
  type: 'hackathon',
  mode: 'offline',
  city: 'pune',
  venue: '',
  start: '',
  end: '',
  deadline: '',
  teamMin: '1',
  teamMax: '4',
  fee: '0',
  prize: '',
  eligibility: 'students',
  themes: [],
  url: '',
  description: '',
  isOrganizer: true,
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.title.trim()) e.title = 'Add the event name.';
  if (!f.organizer.trim()) e.organizer = 'Add who is running it.';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Add a valid email so we can confirm details.';
  if (!f.start) e.start = 'Add a start date.';
  if (!f.end) e.end = 'Add an end date.';
  if (f.start && f.end && f.end < f.start) e.end = 'End date must be on or after the start date.';
  if (!f.deadline) e.deadline = 'Add the registration deadline.';
  if (f.deadline && f.start && f.deadline > f.start) e.deadline = 'Deadline should be on or before the start date.';
  if (Number(f.teamMin) < 1 || Number(f.teamMax) < Number(f.teamMin)) e.teamMax = 'Max team size must be at least the minimum.';
  try {
    const u = new URL(f.url);
    if (!/^https?:$/.test(u.protocol)) throw new Error('bad protocol');
  } catch {
    e.url = 'Add the full registration link, starting with https://';
  }
  if (f.themes.length === 0) e.themes = 'Pick at least one theme.';
  if (f.description.trim().length < 30) e.description = 'Tell students a little more (at least 30 characters).';
  return e;
}

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function SubmitForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const inputProps = (key: keyof FormState) => ({
    id: `sub-${key}`,
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `sub-${key}-error` : undefined,
    className: cn('input', errors[key] && 'border-rose-400'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(`sub-${Object.keys(found)[0]}`)?.focus();
    }
  };

  if (sent) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <CheckCircle2 className="mb-4 h-14 w-14 text-ink" />
        <h2 className="text-2xl font-bold">Thanks! We’ve got “{form.title}”.</h2>
        <p className="mt-2 max-w-md text-ink/70">
          Our team checks every submission before it goes live. We’ll email {form.email} if we need
          anything.
        </p>
        <p className="mt-4 max-w-md rounded-xl bg-ink/5 px-4 py-2 text-xs text-ink">
          Preview: submissions aren’t stored yet. They will be once the review queue launches.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setSent(false);
            }}
            className="btn-secondary"
          >
            Submit another
          </button>
          <Link href="/hackathons" className="btn-primary">
            Explore hackathons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-8 p-6 sm:p-8">
      <section className="space-y-4">
        <h2 className="text-xl font-bold">The basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sub-title" label="Event name" error={errors.title}>
            <input {...inputProps('title')} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={80} />
          </Field>
          <Field id="sub-organizer" label="Organizer" error={errors.organizer} hint="College, club, company or community">
            <input {...inputProps('organizer')} value={form.organizer} onChange={(e) => set('organizer', e.target.value)} maxLength={80} />
          </Field>
          <Field id="sub-type" label="Event type">
            <select {...inputProps('type')} value={form.type} onChange={(e) => set('type', e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="sub-email" label="Your email" error={errors.email}>
            <input {...inputProps('email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={form.isOrganizer} onChange={(e) => set('isOrganizer', e.target.checked)} className="h-4 w-4 accent-black" />
          I’m part of the organizing team
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">When & where</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="sub-start" label="Start date" error={errors.start}>
            <input {...inputProps('start')} type="date" value={form.start} onChange={(e) => set('start', e.target.value)} />
          </Field>
          <Field id="sub-end" label="End date" error={errors.end}>
            <input {...inputProps('end')} type="date" value={form.end} onChange={(e) => set('end', e.target.value)} />
          </Field>
          <Field id="sub-deadline" label="Registration deadline" error={errors.deadline}>
            <input {...inputProps('deadline')} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="sub-mode" label="Mode">
            <select {...inputProps('mode')} value={form.mode} onChange={(e) => set('mode', e.target.value)}>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          {form.mode !== 'online' && (
            <>
              <Field id="sub-city" label="City">
                <select {...inputProps('city')} value={form.city} onChange={(e) => set('city', e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                  <option value="other">Other city</option>
                </select>
              </Field>
              <Field id="sub-venue" label="Venue">
                <input {...inputProps('venue')} value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Campus or address" />
              </Field>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Who can join</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field id="sub-teamMin" label="Min team size">
            <input {...inputProps('teamMin')} type="number" min={1} max={10} value={form.teamMin} onChange={(e) => set('teamMin', e.target.value)} />
          </Field>
          <Field id="sub-teamMax" label="Max team size" error={errors.teamMax}>
            <input {...inputProps('teamMax')} type="number" min={1} max={10} value={form.teamMax} onChange={(e) => set('teamMax', e.target.value)} />
          </Field>
          <Field id="sub-fee" label="Entry fee (₹)" hint="0 if free">
            <input {...inputProps('fee')} type="number" min={0} value={form.fee} onChange={(e) => set('fee', e.target.value)} />
          </Field>
          <Field id="sub-eligibility" label="Eligibility">
            <select {...inputProps('eligibility')} value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)}>
              {ELIGIBILITY.map((el) => (
                <option key={el.value} value={el.value}>
                  {el.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset>
          <legend className="label">Themes</legend>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const active = form.themes.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set('themes', active ? form.themes.filter((x) => x !== t.slug) : [...form.themes, t.slug])}
                  className={cn('chip text-xs', active && 'chip-active')}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          {errors.themes && <p className="mt-1 text-xs font-medium text-rose-600">{errors.themes}</p>}
        </fieldset>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sub-url" label="Registration link" error={errors.url}>
            <input {...inputProps('url')} type="url" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" />
          </Field>
          <Field id="sub-prize" label="Prize pool" hint="e.g. ₹1,00,000 or swag & certificates">
            <input {...inputProps('prize')} value={form.prize} onChange={(e) => set('prize', e.target.value)} />
          </Field>
        </div>
        <Field id="sub-description" label="Short description" error={errors.description} hint="What will students build? Any tracks or rules worth knowing?">
          <textarea {...inputProps('description')} className={cn('input min-h-[120px]', errors.description && 'border-rose-400')} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={800} />
        </Field>
      </section>

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/60">
          By submitting you confirm the details are public and correct. See our{' '}
          <Link href="/terms" className="font-medium text-ink">
            terms
          </Link>
          .
        </p>
        <button type="submit" className="btn-primary">
          <Send className="h-4 w-4" />
          Submit for review
        </button>
      </div>
    </form>
  );
}
