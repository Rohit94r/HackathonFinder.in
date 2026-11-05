'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, Send, X } from 'lucide-react';
import { CITIES, THEMES, type ThemeSlug } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import { ERROR_TEXT, INVALID } from '@/components/community/parts';
import { errorMessage } from '@/components/community/useCommunity';
import { RESULT_LABELS } from '@/data/people';
import { WIN_RESULTS, type WinResult, type WinSections } from '@/data/wins';
import { ApiClientError, apiFetch, goToLogin } from '@/lib/apiClient';
import { useMe } from '@/lib/useMe';
import { cn } from '@/lib/cn';
import {
  HACKATHON_MAX,
  HACKATHON_MIN,
  MAX_COVER_MB,
  MAX_TECH,
  MAX_TEAMMATES,
  MAX_THEMES,
  PRIZE_MAX,
  PROJECT_MAX,
  PROJECT_MIN,
  SECTION_MAX,
  SECTION_MIN,
  TAGLINE_MAX,
  TAGLINE_MIN,
  type WinItem,
} from './model';

export interface WinEventOption {
  slug: string;
  title: string;
  /** City slug; empty for online events. */
  city?: string;
}

interface FormState extends WinSections {
  hackathon: string;
  hackathonSlug: string;
  /** A city slug, or "online". */
  city: string;
  result: WinResult;
  prize: string;
  projectName: string;
  tagline: string;
  themes: ThemeSlug[];
  techStack: string;
  /** Teammates besides the author, comma separated. */
  team: string;
  demo: string;
  github: string;
}

const EMPTY: FormState = {
  hackathon: '',
  hackathonSlug: '',
  city: '',
  result: 'winner',
  prize: '',
  projectName: '',
  tagline: '',
  themes: [],
  techStack: '',
  team: '',
  problem: '',
  built: '',
  won: '',
  lessons: '',
  demo: '',
  github: '',
};

function fromStory(s: WinItem): FormState {
  return {
    hackathon: s.hackathon,
    hackathonSlug: s.hackathonSlug ?? '',
    city: s.city ?? 'online',
    result: s.result,
    prize: s.prize,
    projectName: s.projectName,
    tagline: s.tagline,
    themes: s.themes,
    techStack: s.techStack.join(', '),
    // The author is always first; the form only lists the others.
    team: s.team.slice(1).join(', '),
    ...s.sections,
    demo: s.links.demo ?? '',
    github: s.links.github ?? '',
  };
}

type Field = keyof FormState | 'cover';
type Errors = Partial<Record<Field, string>>;

const SECTION_FIELDS: { key: keyof WinSections; label: string; hint: string }[] = [
  { key: 'problem', label: 'The problem', hint: 'Who has it, and why it matters. Leave a blank line between paragraphs.' },
  { key: 'built', label: 'What you built', hint: 'What it does, and how it works in plain words.' },
  { key: 'won', label: 'How you won', hint: 'What the judges liked, your demo, the questions they asked.' },
  { key: 'lessons', label: 'Tips for other students', hint: 'What you’d tell someone going to their first hackathon.' },
];

function isHttpUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

const splitList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function validate(f: FormState, cover: File | null): Errors {
  const e: Errors = {};
  if (f.hackathon.trim().length < HACKATHON_MIN) e.hackathon = 'Add the hackathon’s name.';
  if (!f.city) e.city = 'Pick the city, or Online.';
  if (f.projectName.trim().length < PROJECT_MIN) e.projectName = 'Add your project’s name.';
  if (f.tagline.trim().length < TAGLINE_MIN) e.tagline = `Describe the project in one line (at least ${TAGLINE_MIN} characters).`;
  if (f.themes.length === 0) e.themes = 'Pick at least one theme.';
  if (splitList(f.techStack).length > MAX_TECH) e.techStack = `Add up to ${MAX_TECH} tools.`;
  if (splitList(f.team).length > MAX_TEAMMATES) e.team = `Add up to ${MAX_TEAMMATES} teammates.`;
  for (const s of SECTION_FIELDS) {
    if (f[s.key].trim().length < SECTION_MIN) e[s.key] = `Write a little more (at least ${SECTION_MIN} characters).`;
  }
  if (f.demo.trim() && !isHttpUrl(f.demo.trim())) e.demo = 'Paste the full link, starting with https://';
  if (f.github.trim() && !isHttpUrl(f.github.trim())) e.github = 'Paste the full link, starting with https://';
  if (cover && cover.size > MAX_COVER_MB * 1024 * 1024) e.cover = `Use an image under ${MAX_COVER_MB} MB.`;
  return e;
}

/** Server field names ("sections.problem", "links.demo") to the form's. */
function fieldsFromServer(fields: Record<string, string>): Errors {
  const out: Errors = {};
  for (const [key, message] of Object.entries(fields)) out[key.replace(/^(sections|links)\./, '') as Field] = message;
  return out;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={ERROR_TEXT}>
      {message}
    </p>
  );
}

/**
 * "Share your win", or editing a story with `initial`. Signed-in students only; on
 * success it opens the story.
 */
export default function WinForm({
  events,
  initial,
  onCancel,
}: {
  events: WinEventOption[];
  /** The story being edited. */
  initial?: WinItem;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const { me } = useMe();
  const editing = Boolean(initial);
  const [form, setForm] = useState<FormState>(() => (initial ? fromStory(initial) : EMPTY));
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [addToRecord, setAddToRecord] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!cover) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const pickListing = (slug: string) => {
    const event = events.find((e) => e.slug === slug);
    setForm((f) => ({
      ...f,
      hackathonSlug: slug,
      hackathon: event ? event.title : f.hackathon,
      city: event ? event.city || 'online' : f.city,
    }));
  };

  const toggleTheme = (slug: ThemeSlug) =>
    setForm((f) => ({
      ...f,
      themes: f.themes.includes(slug) ? f.themes.filter((t) => t !== slug) : f.themes.length < MAX_THEMES ? [...f.themes, slug] : f.themes,
    }));

  const focusFirst = (found: Errors) => {
    const first = Object.keys(found)[0];
    if (first) document.getElementById(`win-${first}`)?.focus();
  };

  const cancel = () => {
    if (onCancel) onCancel();
    else if (initial) router.push(`/wins/${initial.slug}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const found = validate(form, cover);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      focusFirst(found);
      return;
    }

    const data = {
      hackathon: form.hackathon.trim(),
      hackathonSlug: form.hackathonSlug,
      city: form.city,
      result: form.result,
      prize: form.prize.trim(),
      projectName: form.projectName.trim(),
      tagline: form.tagline.trim(),
      themes: form.themes,
      techStack: splitList(form.techStack),
      team: splitList(form.team),
      sections: { problem: form.problem.trim(), built: form.built.trim(), won: form.won.trim(), lessons: form.lessons.trim() },
      links: { demo: form.demo.trim() || undefined, github: form.github.trim() || undefined },
      ...(editing ? { removeCover: removeCover && !cover } : { addToRecord }),
    };
    // With a cover the details travel as JSON inside multipart form data.
    let body: unknown = data;
    if (cover) {
      const fd = new FormData();
      fd.set('data', JSON.stringify(data));
      fd.set('cover', cover);
      body = fd;
    }

    setSending(true);
    try {
      const { win } = await apiFetch<{ win: WinItem }>(initial ? `/api/wins/${initial.slug}` : '/api/wins', {
        method: initial ? 'PATCH' : 'POST',
        body,
      });
      router.push(`/wins/${win.slug}`);
      router.refresh();
    } catch (err) {
      setSending(false);
      if (err instanceof ApiClientError) {
        if (err.status === 401) return goToLogin();
        if (err.code === 'too_large' || err.code === 'unsupported') setErrors({ cover: err.message });
        else if (err.fields) {
          const fields = fieldsFromServer(err.fields);
          setErrors(fields);
          focusFirst(fields);
        }
      }
      setFormError(errorMessage(err));
    }
  };

  const inputProps = (key: Field) => ({
    id: `win-${key}`,
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `win-${key}-error` : undefined,
  });
  const existingCover = initial?.coverUrl && !removeCover ? initial.coverUrl : null;
  const shownCover = preview ?? existingCover;

  return (
    <form onSubmit={submit} noValidate className="card mb-10 space-y-7 p-5 sm:p-8" aria-labelledby="win-form-title">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="win-form-title" className="font-sans text-2xl font-bold normal-case tracking-normal">
            {editing ? 'Edit your story' : 'Share your win'}
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            {editing
              ? 'Change anything below. The link to your story stays the same.'
              : 'Won, came second or made the finals? Tell other students how you did it.'}
          </p>
        </div>
        <button type="button" onClick={cancel} className="shrink-0 rounded-lg p-1.5 hover:bg-ink/5" aria-label="Close the form">
          <X className="h-5 w-5" />
        </button>
      </div>

      {me && !editing && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
          <Avatar name={me.name} image={me.image} size="sm" />
          Posting as <strong className="text-ink">{me.name}</strong>
          <span aria-hidden="true">·</span>
          <Link href="/profile" className="font-semibold text-ink underline underline-offset-2">
            Edit profile
          </Link>
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="win-hackathonSlug" className="label">
            Is it on HackathonFinder? (optional)
          </label>
          <select {...inputProps('hackathonSlug')} value={form.hackathonSlug} onChange={(e) => pickListing(e.target.value)} className="input">
            <option value="">No, or I can’t find it</option>
            {events.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.title}
              </option>
            ))}
          </select>
          <FieldError id="win-hackathonSlug" message={errors.hackathonSlug} />
        </div>
        <div>
          <label htmlFor="win-hackathon" className="label">
            Hackathon name
          </label>
          <input
            {...inputProps('hackathon')}
            value={form.hackathon}
            onChange={(e) => set('hackathon', e.target.value)}
            maxLength={HACKATHON_MAX}
            placeholder="e.g. Capital Hack 2026"
            className={cn('input', errors.hackathon && INVALID)}
          />
          <FieldError id="win-hackathon" message={errors.hackathon} />
        </div>
        <div>
          <label htmlFor="win-city" className="label">
            Where was it?
          </label>
          <select {...inputProps('city')} value={form.city} onChange={(e) => set('city', e.target.value)} className={cn('input', errors.city && INVALID)}>
            <option value="">Pick a city</option>
            <option value="online">Online</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError id="win-city" message={errors.city} />
        </div>
        <div>
          <label htmlFor="win-prize" className="label">
            Prize (optional)
          </label>
          <input
            {...inputProps('prize')}
            value={form.prize}
            onChange={(e) => set('prize', e.target.value)}
            maxLength={PRIZE_MAX}
            placeholder="e.g. $1,000 + incubation interview"
            className={cn('input', errors.prize && INVALID)}
          />
          <FieldError id="win-prize" message={errors.prize} />
        </div>
      </div>

      <fieldset>
        <legend className="label">Your result</legend>
        <div className="flex flex-wrap gap-2">
          {WIN_RESULTS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={form.result === r}
              onClick={() => set('result', r)}
              className={cn('chip text-sm', form.result === r && 'chip-active')}
            >
              {RESULT_LABELS[r]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_2fr]">
        <div>
          <label htmlFor="win-projectName" className="label">
            Project name
          </label>
          <input
            {...inputProps('projectName')}
            value={form.projectName}
            onChange={(e) => set('projectName', e.target.value)}
            maxLength={PROJECT_MAX}
            placeholder="e.g. RentRight"
            className={cn('input', errors.projectName && INVALID)}
          />
          <FieldError id="win-projectName" message={errors.projectName} />
        </div>
        <div>
          <label htmlFor="win-tagline" className="label">
            One line about it
          </label>
          <input
            {...inputProps('tagline')}
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            maxLength={TAGLINE_MAX}
            placeholder="e.g. Spot unfair clauses in a rent agreement before you sign it."
            className={cn('input', errors.tagline && INVALID)}
          />
          <FieldError id="win-tagline" message={errors.tagline} />
        </div>
      </div>

      <fieldset aria-describedby={errors.themes ? 'win-themes-error' : undefined}>
        <legend className="label">Themes (up to {MAX_THEMES})</legend>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t, i) => (
            <button
              key={t.slug}
              id={i === 0 ? 'win-themes' : undefined}
              type="button"
              aria-pressed={form.themes.includes(t.slug)}
              onClick={() => toggleTheme(t.slug)}
              className={cn('chip text-xs', form.themes.includes(t.slug) && 'chip-active')}
            >
              {t.name}
            </button>
          ))}
        </div>
        <FieldError id="win-themes" message={errors.themes} />
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="win-techStack" className="label">
            Tech stack (optional, separate with commas)
          </label>
          <input
            {...inputProps('techStack')}
            value={form.techStack}
            onChange={(e) => set('techStack', e.target.value)}
            maxLength={400}
            placeholder="Next.js, FastAPI, PostgreSQL"
            className={cn('input', errors.techStack && INVALID)}
          />
          <FieldError id="win-techStack" message={errors.techStack} />
        </div>
        <div>
          <label htmlFor="win-team" className="label">
            Teammates (optional, separate with commas)
          </label>
          <input
            {...inputProps('team')}
            value={form.team}
            onChange={(e) => set('team', e.target.value)}
            maxLength={400}
            placeholder="Kunal Mehta, Pooja Bisht"
            className={cn('input', errors.team && INVALID)}
          />
          <FieldError id="win-team" message={errors.team} />
        </div>
      </div>

      {SECTION_FIELDS.map((s) => (
        <div key={s.key}>
          <label htmlFor={`win-${s.key}`} className="label">
            {s.label}
          </label>
          <p id={`win-${s.key}-hint`} className="-mt-1 mb-2 text-xs text-ink/60">
            {s.hint}
          </p>
          <textarea
            id={`win-${s.key}`}
            value={form[s.key]}
            onChange={(e) => set(s.key, e.target.value)}
            maxLength={SECTION_MAX}
            aria-invalid={Boolean(errors[s.key]) || undefined}
            aria-describedby={cn(`win-${s.key}-hint`, errors[s.key] && `win-${s.key}-error`)}
            className={cn('input min-h-[110px]', errors[s.key] && INVALID)}
          />
          <FieldError id={`win-${s.key}`} message={errors[s.key]} />
        </div>
      ))}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="win-demo" className="label">
            Demo link (optional)
          </label>
          <input
            {...inputProps('demo')}
            type="url"
            inputMode="url"
            value={form.demo}
            onChange={(e) => set('demo', e.target.value)}
            maxLength={300}
            placeholder="https://"
            className={cn('input', errors.demo && INVALID)}
          />
          <FieldError id="win-demo" message={errors.demo} />
        </div>
        <div>
          <label htmlFor="win-github" className="label">
            Code link (optional)
          </label>
          <input
            {...inputProps('github')}
            type="url"
            inputMode="url"
            value={form.github}
            onChange={(e) => set('github', e.target.value)}
            maxLength={300}
            placeholder="https://github.com/…"
            className={cn('input', errors.github && INVALID)}
          />
          <FieldError id="win-github" message={errors.github} />
        </div>
      </div>

      <div>
        <p className="label">Cover photo (optional)</p>
        {shownCover ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownCover} alt="Cover preview" className="h-28 w-auto max-w-full rounded-lg object-cover ring-1 ring-ink/10" />
            <div className="flex flex-wrap gap-2">
              <label htmlFor="win-cover" className="btn-secondary cursor-pointer py-2 text-sm">
                <ImagePlus className="h-4 w-4" />
                Change
              </label>
              <button
                type="button"
                onClick={() => {
                  setCover(null);
                  if (existingCover && !preview) setRemoveCover(true);
                }}
                className="btn-secondary py-2 text-sm"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="win-cover"
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-5 text-sm text-ink/70 transition hover:border-ink/40',
              errors.cover ? 'border-brand-500' : 'border-ink/20'
            )}
          >
            <ImagePlus className="h-6 w-6 shrink-0 text-ink" />
            <span>
              <strong className="text-ink">Add a photo</strong> of your team, demo or prize. JPG, PNG or WebP, up to {MAX_COVER_MB} MB.
            </span>
          </label>
        )}
        <input
          id="win-cover"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          aria-describedby={errors.cover ? 'win-cover-error' : undefined}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            if (file) setRemoveCover(false);
            setCover(file);
            e.target.value = '';
          }}
        />
        <FieldError id="win-cover" message={errors.cover} />
      </div>

      {!editing && (
        <label className="flex items-start gap-3 rounded-lg bg-ink/5 p-4 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={addToRecord}
            onChange={(e) => setAddToRecord(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
          />
          <span>
            <strong className="text-ink">Add this to my hackathon record.</strong> It shows on your profile with your other
            results.
          </span>
        </label>
      )}

      {formError && (
        <p role="alert" className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:bg-brand-400/10 dark:text-brand-200">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/60">Be kind about other teams, and only share what your team is happy to make public.</p>
        <div className="flex gap-3">
          <button type="button" onClick={cancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Saving…' : editing ? 'Save changes' : 'Post my story'}
          </button>
        </div>
      </div>
    </form>
  );
}
