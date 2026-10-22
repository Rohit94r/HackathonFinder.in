'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, X } from 'lucide-react';
import { CITIES } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import { CATEGORIES, type CategoryId } from '@/data/discussions';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { useMe } from '@/lib/useMe';
import { cn } from '@/lib/cn';
import { BODY_MAX, BODY_MIN, MAX_TAGS, TITLE_MAX, TITLE_MIN, type ThreadItem } from './model';
import { ERROR_TEXT, INVALID, TagFields, tagsFromDraft, type TagDraft } from './parts';
import { errorMessage } from './useCommunity';

export interface EventOption {
  slug: string;
  title: string;
}

type Field = 'title' | 'category' | 'body' | 'tags' | 'city' | 'hackathonSlug';
type Errors = Partial<Record<Field, string>>;

/** "Start a discussion". Only shown to signed-in students; posts to /api/threads. */
export default function NewThreadForm({
  events,
  defaults,
  onPosted,
  onCancel,
}: {
  events: EventOption[];
  defaults: { category: CategoryId | ''; city: string; hackathonSlug: string };
  onPosted: (thread: ThreadItem) => void;
  onCancel: () => void;
}) {
  const { me } = useMe();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId | ''>(defaults.category);
  const [city, setCity] = useState(defaults.city);
  const [hackathonSlug, setHackathonSlug] = useState(defaults.hackathonSlug);
  const [tags, setTags] = useState<TagDraft>({ themes: [], extra: '' });
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('nt-title')?.focus({ preventScroll: true });
  }, []);

  // Fill in the student's city once their account loads, unless a filter already chose one.
  useEffect(() => {
    if (me?.city && !defaults.city) setCity((c) => c || me.city);
  }, [me?.city, defaults.city]);

  const focusFirst = (found: Errors) => {
    const first = (Object.keys(found) as Field[])[0];
    if (first) document.getElementById(`nt-${first}`)?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const found: Errors = {};
    const cleanTags = tagsFromDraft(tags);
    if (title.trim().length < TITLE_MIN) found.title = `Write a title of at least ${TITLE_MIN} characters. A clear question works best.`;
    if (!category) found.category = 'Pick a topic so the right people see it.';
    if (body.trim().length < BODY_MIN) found.body = `Add a few more details (at least ${BODY_MIN} characters).`;
    if (cleanTags.length > MAX_TAGS) found.tags = `Use up to ${MAX_TAGS} tags in all.`;
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      focusFirst(found);
      return;
    }

    setSending(true);
    try {
      const { thread } = await apiFetch<{ thread: ThreadItem }>('/api/threads', {
        body: {
          title: title.trim(),
          body: body.trim(),
          category,
          tags: cleanTags,
          city: city || undefined,
          hackathonSlug: hackathonSlug || undefined,
        },
      });
      onPosted(thread);
    } catch (err) {
      setSending(false);
      if (err instanceof ApiClientError && err.fields) {
        const fields = err.fields as Errors;
        setErrors(fields);
        focusFirst(fields);
      }
      setFormError(errorMessage(err));
    }
  };

  const error = (field: Field) =>
    errors[field] && (
      <p id={`nt-${field}-error`} className={ERROR_TEXT}>
        {errors[field]}
      </p>
    );
  const invalid = (field: Field) => ({
    'aria-invalid': Boolean(errors[field]) || undefined,
    'aria-describedby': errors[field] ? `nt-${field}-error` : undefined,
  });

  return (
    <form
      ref={formRef}
      id="new-discussion"
      onSubmit={submit}
      noValidate
      aria-label="Start a discussion"
      className="card mb-6 scroll-mt-24 space-y-5 p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-sans text-xl font-bold normal-case tracking-normal">Start a discussion</h2>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-ink hover:bg-ink/5" aria-label="Close the form">
          <X className="h-5 w-5" />
        </button>
      </div>

      {me && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
          <Avatar name={me.name} image={me.image} size="sm" />
          Posting as <strong className="text-ink">{me.name}</strong>
          <span aria-hidden="true">·</span>
          <Link href="/profile" className="font-semibold text-ink underline underline-offset-2">
            Edit profile
          </Link>
        </p>
      )}

      <div>
        <label htmlFor="nt-title" className="label">
          Title
        </label>
        <input
          id="nt-title"
          className={cn('input', errors.title && INVALID)}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="e.g. Is GameJam Pune okay for first-timers?"
          {...invalid('title')}
        />
        {error('title')}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="nt-category" className="label">
            Topic
          </label>
          <select
            id="nt-category"
            className={cn('input', errors.category && INVALID)}
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | '')}
            {...invalid('category')}
          >
            <option value="">Choose a topic</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {error('category')}
        </div>
        <div>
          <label htmlFor="nt-city" className="label">
            City (optional)
          </label>
          <select id="nt-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} {...invalid('city')}>
            <option value="">All of India</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          {error('city')}
        </div>
        <div>
          <label htmlFor="nt-hackathonSlug" className="label">
            Hackathon (optional)
          </label>
          <select
            id="nt-hackathonSlug"
            className="input"
            value={hackathonSlug}
            onChange={(e) => setHackathonSlug(e.target.value)}
            {...invalid('hackathonSlug')}
          >
            <option value="">Not about one event</option>
            {events.map((ev) => (
              <option key={ev.slug} value={ev.slug}>
                {ev.title}
              </option>
            ))}
          </select>
          {error('hackathonSlug')}
        </div>
      </div>

      <TagFields idPrefix="nt" value={tags} onChange={setTags} error={errors.tags} />

      <div>
        <label htmlFor="nt-body" className="label">
          Details
        </label>
        <textarea
          id="nt-body"
          className={cn('input min-h-[140px]', errors.body && INVALID)}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          placeholder="Share the context: what you’ve tried, your skills, the event or city. Leave a blank line between paragraphs."
          {...invalid('body')}
        />
        {error('body')}
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:bg-brand-400/10 dark:text-brand-200">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/60">Be kind and specific. Don’t post phone numbers. You can edit your post for 24 hours.</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary py-2.5">
            Cancel
          </button>
          <button type="submit" className="btn-primary py-2.5" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
