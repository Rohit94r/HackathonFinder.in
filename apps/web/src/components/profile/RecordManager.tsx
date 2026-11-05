'use client';

import { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { RESULT_LABELS } from '@/data/people';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import type { ProfileEvent } from './MyProfileView';
import { type ProfileRecord, type ResultKind } from './profileTypes';
import RecordList from './RecordList';

const RESULTS: ResultKind[] = ['winner', 'runner-up', 'finalist', 'participant'];

type Field = 'event' | 'result' | 'project' | 'date' | 'hackathonSlug';
interface Draft {
  event: string;
  result: ResultKind | '';
  project: string;
  date: string;
}

const EMPTY: Draft = { event: '', result: '', project: '', date: '' };

const todayInIndia = () => new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);

function RecordForm({
  initial,
  events,
  onSave,
  onCancel,
}: {
  initial?: ProfileRecord;
  events: ProfileEvent[];
  onSave: (body: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(
    initial ? { event: initial.event, result: initial.result, project: initial.project, date: initial.date.slice(0, 10) } : EMPTY
  );
  const [errors, setErrors] = useState<Partial<Record<Field | '_', string>>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  // Typing a listing's exact title links the entry to it.
  const listing = events.find((e) => e.title.toLowerCase() === draft.event.trim().toLowerCase());
  const today = todayInIndia();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (draft.event.trim().length < 2) found.event = 'Add the hackathon’s name.';
    if (!draft.result) found.result = 'Pick how it went.';
    if (!draft.date) found.date = 'Add when it happened.';
    else if (draft.date > today) found.date = 'That date is in the future. Add hackathons once they’re over.';
    setErrors(found);
    const first = (['event', 'result', 'date'] as Field[]).find((k) => found[k]);
    if (first) {
      document.getElementById(`rec-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSave({
        event: draft.event.trim(),
        result: draft.result,
        project: draft.project.trim(),
        // Midday in India, so the date never slips to the day before.
        date: `${draft.date}T12:00:00+05:30`,
        hackathonSlug: listing?.slug ?? '',
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        const fields = err.fields ?? {};
        const hasFields = Object.keys(fields).length > 0;
        setErrors({ ...fields, event: fields.event ?? fields.hackathonSlug, _: hasFields ? undefined : err.message });
      } else setErrors({ _: 'Something went wrong. Please try again.' });
      setBusy(false);
    }
  };

  const err = (key: Field) =>
    errors[key] && (
      <p id={`rec-${key}-error`} className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">
        {errors[key]}
      </p>
    );
  const invalid = (key: Field) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `rec-${key}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-lg border border-ink/15 bg-ink/[0.03] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base">{initial ? 'Edit this hackathon' : 'Add a hackathon you took part in'}</h3>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 hover:bg-ink/5" aria-label="Close without saving">
          <X className="h-4 w-4" />
        </button>
      </div>
      {errors._ && (
        <p role="alert" className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {errors._}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="rec-event" className="label">
            Hackathon
          </label>
          <input
            id="rec-event"
            list="rec-event-options"
            value={draft.event}
            onChange={(e) => set('event', e.target.value)}
            maxLength={120}
            placeholder="e.g. HackMIT 2025"
            className={cn('input', errors.event && 'border-brand-500')}
            {...invalid('event')}
          />
          <datalist id="rec-event-options">
            {events.map((e) => (
              <option key={e.slug} value={e.title} />
            ))}
          </datalist>
          {err('event') ??
            (listing ? (
              <p className="mt-1 text-xs text-ink/60">Linked to our listing for {listing.title}.</p>
            ) : (
              <p className="mt-1 text-xs text-ink/60">Pick one of ours from the list to link it, or type any hackathon.</p>
            ))}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="label">How did it go?</legend>
          <div className="flex flex-wrap gap-2" id="rec-result" tabIndex={-1} {...invalid('result')}>
            {RESULTS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={draft.result === r}
                onClick={() => set('result', r)}
                className={cn('chip text-xs', draft.result === r && 'chip-active')}
              >
                {RESULT_LABELS[r]}
              </button>
            ))}
          </div>
          {err('result')}
        </fieldset>
        <div>
          <label htmlFor="rec-project" className="label">
            What you built (optional)
          </label>
          <input
            id="rec-project"
            value={draft.project}
            onChange={(e) => set('project', e.target.value)}
            maxLength={120}
            placeholder="e.g. FloodWatch"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="rec-date" className="label">
            When it ended
          </label>
          <input
            id="rec-date"
            type="date"
            value={draft.date}
            max={today}
            min="2000-01-01"
            onChange={(e) => set('date', e.target.value)}
            className={cn('input', errors.date && 'border-brand-500')}
            {...invalid('date')}
          />
          {err('date')}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">
          Cancel
        </button>
        <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={busy}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Add to my record'}
        </button>
      </div>
    </form>
  );
}

/** The student's own hackathon record, with add, edit and delete. */
export default function RecordManager({
  record,
  events,
  storyLinks,
  onChange,
}: {
  record: ProfileRecord[];
  events: ProfileEvent[];
  storyLinks: Record<string, string>;
  /** Called with the whole record after every change. */
  onChange: (record: ProfileRecord[]) => void;
}) {
  const [mode, setMode] = useState<{ kind: 'add' } | { kind: 'edit'; id: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editing = mode?.kind === 'edit' ? record.find((r) => r.id === mode.id) : undefined;

  const save = async (body: Record<string, string>) => {
    const res = editing
      ? await apiFetch<{ record: ProfileRecord[] }>(`/api/me/record/${editing.id}`, { method: 'PATCH', body })
      : await apiFetch<{ record: ProfileRecord[] }>('/api/me/record', { body });
    onChange(res.record);
    setMode(null);
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      const res = await apiFetch<{ record: ProfileRecord[] }>(`/api/me/record/${id}`, { method: 'DELETE' });
      onChange(res.record);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t remove that. Try again.');
    } finally {
      setConfirming(null);
    }
  };

  const form = mode && (
    <RecordForm key={mode.kind === 'edit' ? mode.id : 'add'} initial={editing} events={events} onSave={save} onCancel={() => setMode(null)} />
  );

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {error}
        </p>
      )}
      {record.length > 0 ? (
        <RecordList
          record={record}
          storyLinks={storyLinks}
          actions={(r) =>
            confirming === r.id ? (
              <span className="flex items-center gap-1 text-xs">
                <span className="font-semibold text-ink/80">Remove?</span>
                <button type="button" onClick={() => void remove(r.id)} className="rounded-lg px-2 py-1 font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10">
                  Yes
                </button>
                <button type="button" onClick={() => setConfirming(null)} className="rounded-lg px-2 py-1 font-semibold text-ink/70 hover:bg-ink/5">
                  No
                </button>
              </span>
            ) : (
              <span className="flex items-center">
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'edit', id: r.id })}
                  className="rounded-lg p-1.5 text-ink/55 hover:bg-ink/5 hover:text-ink"
                  aria-label={`Edit ${r.event}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(r.id)}
                  className="rounded-lg p-1.5 text-ink/55 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                  aria-label={`Remove ${r.event}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            )
          }
        />
      ) : (
        !mode && (
          <p className="rounded-lg border border-dashed border-ink/20 p-5 text-sm text-ink/70">
            Add hackathons you’ve been to, even ones from before you joined. They fill your results ring, stats and badges.
          </p>
        )
      )}
      {form ??
        (record.length < 100 && (
          <button type="button" onClick={() => setMode({ kind: 'add' })} className="btn-secondary w-full py-2.5 text-sm sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add a hackathon
          </button>
        ))}
    </div>
  );
}
