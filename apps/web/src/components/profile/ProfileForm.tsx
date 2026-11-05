'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { CITIES } from '@hackathonfinder/shared';
import { SKILLS } from '@/data/skills';
import { ApiClientError } from '@/lib/apiClient';
import { toHandle, type MyProfile } from '@/lib/useProfile';
import { cn } from '@/lib/cn';
import AvatarUploader from './AvatarUploader';

const EMPTY: MyProfile = {
  name: '',
  handle: '',
  about: '',
  college: '',
  city: '',
  skills: [],
  bio: '',
  github: '',
  linkedin: '',
  lookingForTeam: true,
};

const MAX_SKILLS = 6;
const MAX_BIO = 200;

type Errors = Partial<Record<'name' | 'handle' | 'city' | 'github' | 'linkedin' | '_form', string>>;
const FIELDS = ['name', 'handle', 'city', 'github', 'linkedin'] as const;

function isHttpUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validate(f: MyProfile): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = 'Add your name.';
  if (!f.city) e.city = 'Pick your city, so we can show hackathons near you first.';
  if (f.github.trim() && !isHttpUrl(f.github.trim())) e.github = 'Paste the full link, starting with https://';
  if (f.linkedin.trim() && !isHttpUrl(f.linkedin.trim())) e.linkedin = 'Paste the full link, starting with https://';
  return e;
}

/** Create or edit the student's profile. Server errors (like a taken handle) show on their field. */
export default function ProfileForm({
  initial,
  mode,
  onSave,
  onCancel,
}: {
  initial?: MyProfile | null;
  /** "create" for onboarding (fields may be prefilled from sign-up); defaults to edit when `initial` is set. */
  mode?: 'create' | 'edit';
  onSave: (profile: MyProfile) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<MyProfile>({ ...EMPTY, ...initial });
  // Until the student edits it, the handle follows their name.
  const [handleEdited, setHandleEdited] = useState(Boolean(initial?.handle));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const editing = (mode ?? (initial ? 'edit' : 'create')) === 'edit';

  const set = <K extends keyof MyProfile>(key: K, value: MyProfile[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handle = handleEdited ? form.handle : toHandle(form.name || '');
  const toggleSkill = (s: string) =>
    set('skills', form.skills.includes(s) ? form.skills.filter((x) => x !== s) : form.skills.length < MAX_SKILLS ? [...form.skills, s] : form.skills);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = FIELDS.find((k) => found[k]);
    if (first) {
      document.getElementById(`pf-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        handle: toHandle(handle || form.name),
        about: form.about.trim(),
        college: form.college.trim(),
        bio: form.bio.trim(),
        github: form.github.trim(),
        linkedin: form.linkedin.trim(),
      });
    } catch (err) {
      const fields = (err instanceof ApiClientError && err.fields) || {};
      const next: Errors = {};
      for (const k of FIELDS) if (fields[k]) next[k] = fields[k];
      next._form = err instanceof ApiClientError ? err.message : 'Couldn’t save your profile. Try again.';
      setErrors(next);
      const bad = FIELDS.find((k) => next[k]);
      if (bad) {
        setHandleEdited(true);
        document.getElementById(`pf-${bad}`)?.focus();
      }
    } finally {
      setBusy(false);
    }
  };

  const errorProps = (key: keyof Errors) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `pf-${key}-error` : undefined,
  });
  const errorText = (key: keyof Errors) =>
    errors[key] && (
      <p id={`pf-${key}-error`} className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">
        {errors[key]}
      </p>
    );

  return (
    <form onSubmit={submit} noValidate className="card space-y-6 p-6 sm:p-8" aria-labelledby="pf-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="pf-title" className="font-sans text-2xl font-bold normal-case tracking-normal">
            {editing ? 'Edit your profile' : 'Create your profile'}
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Your name and city are required. A photo, your college and skills help teammates know who they’re inviting.
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 hover:bg-ink/5" aria-label="Close without saving">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <AvatarUploader name={form.name} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-name" className="label">
            Your name
          </label>
          <input
            id="pf-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            maxLength={40}
            autoComplete="name"
            className={cn('input', errors.name && 'border-brand-500')}
            {...errorProps('name')}
          />
          {errorText('name')}
        </div>
        <div>
          <label htmlFor="pf-handle" className="label">
            Username
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/45" aria-hidden="true">
              @
            </span>
            <input
              id="pf-handle"
              value={handle}
              onChange={(e) => {
                setHandleEdited(true);
                set('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              maxLength={30}
              placeholder="your-name"
              aria-invalid={Boolean(errors.handle) || undefined}
              aria-describedby={errors.handle ? 'pf-handle-error' : 'pf-handle-hint'}
              className={cn('input pl-8', errors.handle && 'border-brand-500')}
            />
          </div>
          {errorText('handle') ?? (
            <p id="pf-handle-hint" className="mt-1 text-xs text-ink/60">
              Letters, numbers and dashes. Your profile link: /u/{handle || 'your-name'}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="pf-about" className="label">
            Year and branch
          </label>
          <input
            id="pf-about"
            value={form.about}
            onChange={(e) => set('about', e.target.value)}
            maxLength={60}
            placeholder="e.g. 2nd year, Information Technology…"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="pf-college" className="label">
            College
          </label>
          <input
            id="pf-college"
            value={form.college}
            onChange={(e) => set('college', e.target.value)}
            maxLength={80}
            placeholder="e.g. College of Engineering, Pune…"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="pf-city" className="label">
            City
          </label>
          <select
            id="pf-city"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className={cn('input', errors.city && 'border-brand-500')}
            {...errorProps('city')}
          >
            <option value="">Pick your city</option>
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
        <legend className="label">Skills (up to {MAX_SKILLS})</legend>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={form.skills.includes(s)}
              onClick={() => toggleSkill(s)}
              className={cn('chip text-xs', form.skills.includes(s) && 'chip-active')}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="pf-bio" className="label">
          A line about you
        </label>
        <textarea
          id="pf-bio"
          value={form.bio}
          onChange={(e) => set('bio', e.target.value.slice(0, MAX_BIO))}
          maxLength={MAX_BIO}
          placeholder="e.g. Backend and small ML models. Looking for a designer who cares about details."
          aria-describedby="pf-bio-count"
          className="input min-h-[90px]"
        />
        <p id="pf-bio-count" className="mt-1 text-right text-xs text-ink/50">
          {form.bio.length}/{MAX_BIO}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-github" className="label">
            GitHub (optional)
          </label>
          <input
            id="pf-github"
            type="url"
            inputMode="url"
            value={form.github}
            onChange={(e) => set('github', e.target.value)}
            placeholder="https://github.com/…"
            className={cn('input', errors.github && 'border-brand-500')}
            {...errorProps('github')}
          />
          {errorText('github')}
        </div>
        <div>
          <label htmlFor="pf-linkedin" className="label">
            LinkedIn (optional)
          </label>
          <input
            id="pf-linkedin"
            type="url"
            inputMode="url"
            value={form.linkedin}
            onChange={(e) => set('linkedin', e.target.value)}
            placeholder="https://www.linkedin.com/in/…"
            className={cn('input', errors.linkedin && 'border-brand-500')}
            {...errorProps('linkedin')}
          />
          {errorText('linkedin')}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={form.lookingForTeam}
        onClick={() => set('lookingForTeam', !form.lookingForTeam)}
        className="flex w-full items-center justify-between gap-4 rounded-lg border border-ink/15 px-4 py-3 text-left transition hover:border-ink/30"
      >
        <span>
          <span className="block text-sm font-semibold text-ink">Looking for a team</span>
          <span className="block text-xs text-ink/60">Shows a badge on your profile so other students can invite you.</span>
        </span>
        <span
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-[5px] transition',
            form.lookingForTeam ? 'bg-brand-600' : 'bg-ink/20'
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              'inline-block h-5 w-5 rounded-[3px] bg-white shadow transition',
              form.lookingForTeam ? 'translate-x-[22px]' : 'translate-x-0.5'
            )}
          />
        </span>
      </button>

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        {errors._form ? (
          <p role="alert" className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {errors._form}
          </p>
        ) : (
          <p className="text-xs text-ink/60">Anyone can see your profile. Your email is never shown.</p>
        )}
        <div className="flex gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create my profile'}
          </button>
        </div>
      </div>
    </form>
  );
}
