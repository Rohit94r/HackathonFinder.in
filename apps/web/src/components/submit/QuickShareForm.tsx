'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSWRConfig } from 'swr';
import { ImagePlus, Loader2, Send, X } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import SubmitResult, { type SubmitResponse } from './SubmitResult';

const SEEN_ON = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'A website' },
  { value: 'other', label: 'Somewhere else' },
];

const MAX_POSTER_MB = 8;

interface FormState {
  seenOn: string;
  url: string;
  message: string;
  poster: File | null;
  email: string;
}

const EMPTY: FormState = { seenOn: '', url: '', message: '', poster: null, email: '' };

type Errors = Partial<Record<'url' | 'message' | 'poster' | 'email' | 'form', string>>;

const errorText = 'mt-1 text-xs font-medium text-red-600 dark:text-red-400';

function validate(f: FormState): Errors {
  const e: Errors = {};
  const url = f.url.trim();
  if (url) {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) throw new Error('bad protocol');
    } catch {
      e.url = 'Paste the full link, starting with https://';
    }
  }
  if (!url && !f.poster && f.message.trim().length < 20) {
    e.message = 'Add a link, a poster, or paste the post or message (at least 20 characters).';
  }
  if (f.poster && f.poster.size > MAX_POSTER_MB * 1024 * 1024) e.poster = `Use an image under ${MAX_POSTER_MB} MB.`;
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Check your email, or leave it empty.';
  return e;
}

/**
 * The quick way in for students: where they saw an event plus a link, a pasted
 * message or a poster. Our agents read it and fill in the details.
 */
export default function QuickShareForm() {
  const { status } = useSession();
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!form.poster) {
      setPreview(null);
      return;
    }
    const src = URL.createObjectURL(form.poster);
    setPreview(src);
    return () => URL.revokeObjectURL(src);
  }, [form.poster]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`qs-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const body = new FormData();
    body.set('kind', 'quick');
    if (form.seenOn) body.set('seenOn', form.seenOn);
    if (form.url.trim()) body.set('url', form.url.trim());
    if (form.message.trim()) body.set('message', form.message.trim());
    if (form.email.trim()) body.set('email', form.email.trim());
    if (form.poster) body.set('poster', form.poster);
    setSending(true);
    try {
      const res = await apiFetch<SubmitResponse>('/api/submissions', { body });
      setResult(res);
      if (status === 'authenticated') mutate('/api/me/submissions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const apiErr = err instanceof ApiClientError ? err : null;
      setErrors({ ...(apiErr?.fields ?? {}), form: apiErr?.message ?? 'Something went wrong. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <SubmitResult
        result={result}
        what={form.poster ? 'poster' : form.url ? 'link' : 'message'}
        email={form.email}
        signedIn={status === 'authenticated'}
        onAgain={() => {
          setForm(EMPTY);
          setResult(null);
        }}
        againLabel="Share another"
      />
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-7 p-6 sm:p-8">
      <fieldset>
        <legend className="label">Where did you see it?</legend>
        <div className="flex flex-wrap gap-2">
          {SEEN_ON.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={form.seenOn === s.value}
              onClick={() => set('seenOn', form.seenOn === s.value ? '' : s.value)}
              className={cn('chip text-sm', form.seenOn === s.value && 'chip-active')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="qs-url" className="label">
          Link to the post or page
        </label>
        <input
          id="qs-url"
          type="url"
          inputMode="url"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          placeholder="https://www.instagram.com/p/…"
          aria-invalid={Boolean(errors.url) || undefined}
          aria-describedby={errors.url ? 'qs-url-error' : undefined}
          className={cn('input', errors.url && 'border-red-400')}
        />
        {errors.url && (
          <p id="qs-url-error" className={errorText}>
            {errors.url}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="qs-message" className="label">
          No link? Paste the post or forwarded message
        </label>
        <textarea
          id="qs-message"
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          maxLength={5000}
          placeholder="e.g. the WhatsApp forward with the dates and registration details…"
          aria-invalid={Boolean(errors.message) || undefined}
          aria-describedby={errors.message ? 'qs-message-error' : undefined}
          className={cn('input min-h-[110px]', errors.message && 'border-red-400')}
        />
        {errors.message && (
          <p id="qs-message-error" className={errorText}>
            {errors.message}
          </p>
        )}
      </div>

      <div>
        <p className="label">Poster or screenshot (optional)</p>
        {preview ? (
          <div className="flex flex-wrap items-center gap-4">
            <img src={preview} alt="Poster preview" className="h-28 w-auto max-w-full rounded-lg object-cover ring-1 ring-ink/10" />
            <button type="button" onClick={() => set('poster', null)} className="btn-secondary py-2 text-sm">
              <X className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor="qs-poster"
            className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-ink/20 px-4 py-5 text-sm text-ink/70 transition hover:border-ink/40"
          >
            <ImagePlus className="h-6 w-6 shrink-0 text-ink" />
            <span>
              <strong className="text-ink">Add the poster</strong>. We read the dates and details from it.
            </span>
          </label>
        )}
        <input
          id="qs-poster"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            set('poster', e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
        {errors.poster && <p className={errorText}>{errors.poster}</p>}
      </div>

      <div>
        <label htmlFor="qs-email" className="label">
          Your email (optional)
        </label>
        <input
          id="qs-email"
          type="email"
          spellCheck={false}
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder={status === 'authenticated' ? 'We’ll also tell you in your notifications' : 'We’ll tell you when it’s live'}
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={errors.email ? 'qs-email-error' : undefined}
          className={cn('input', errors.email && 'border-red-400')}
        />
        {errors.email && (
          <p id="qs-email-error" className={errorText}>
            {errors.email}
          </p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/60">Only share events that are posted publicly. We link back to the official page.</p>
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Reading it…' : 'Share it'}
        </button>
      </div>
    </form>
  );
}
