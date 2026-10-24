'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { CITIES, ELIGIBILITY, EVENT_TYPES, MODES, THEMES } from '@hackathonfinder/shared';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { ORGANIZER_TYPES, type ListingFormValues } from './listingFields';
import { Button, inputClass, labelClass, Thumb } from './ui';

type Errors = Record<string, string>;

function Field({ name, label, hint, errors, children, className }: { name: string; label: string; hint?: string; errors: Errors; children: React.ReactNode; className?: string }) {
  const error = errors[name];
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={`le-${name}`} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      {error && (
        <p id={`le-${name}-error`} className="mt-1 text-xs font-semibold text-black">
          ! {error}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 border-t border-neutral-200 pt-4 first:border-0 first:pt-0">
      <legend className="float-left mb-1 w-full text-sm font-semibold">{title}</legend>
      <div className="clear-both space-y-3">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn('rounded-[2px] border px-2 py-0.5 text-xs', on ? 'border-black bg-black text-white' : 'border-neutral-400 hover:border-black')}>
      {children}
    </button>
  );
}

/** Uploads an image to Cloudinary (through /api/admin/upload) and hands back its link. */
function UploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-label="Upload a banner image"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (file.size > 8 * 1024 * 1024) {
            setProblem('Use an image under 8 MB.');
            return;
          }
          setBusy(true);
          setProblem('');
          try {
            const form = new FormData();
            form.set('file', file);
            const res = await apiFetch<{ url: string }>('/api/admin/upload', { body: form });
            onUploaded(res.url);
          } catch (err) {
            setProblem(err instanceof ApiClientError ? err.message : 'The upload didn’t work.');
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button size="sm" icon={Upload} busy={busy} onClick={() => input.current?.click()}>
        Upload image
      </Button>
      {problem && <p className="mt-1 text-xs font-semibold">! {problem}</p>}
    </div>
  );
}

/**
 * Every listing field, for reviewing a submission, a pending listing from the
 * pipeline, or editing a live one. Dates are entered in India time.
 */
export default function ListingEditor({
  value,
  onChange,
  errors = {},
  showFlags = true,
}: {
  value: ListingFormValues;
  onChange: (next: ListingFormValues) => void;
  errors?: Errors;
  showFlags?: boolean;
}) {
  const set = <K extends keyof ListingFormValues>(key: K, v: ListingFormValues[K]) => onChange({ ...value, [key]: v });
  const input = (name: keyof ListingFormValues) => ({
    id: `le-${name}`,
    'aria-invalid': Boolean(errors[name]) || undefined,
    'aria-describedby': errors[name] ? `le-${name}-error` : undefined,
    className: cn(inputClass, errors[name] && 'border-2 border-black'),
  });
  const area = (name: keyof ListingFormValues) => ({ ...input(name), className: cn(inputClass, 'h-auto min-h-[84px] py-2', errors[name] && 'border-2 border-black') });
  const toggle = <T extends string>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <div className="space-y-5">
      <Section title="The basics">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="title" label="Title" errors={errors}>
            <input {...input('title')} value={value.title} onChange={(e) => set('title', e.target.value)} maxLength={140} />
          </Field>
          <Field name="organizer" label="Organizer" errors={errors}>
            <input {...input('organizer')} value={value.organizer} onChange={(e) => set('organizer', e.target.value)} maxLength={140} />
          </Field>
          <Field name="type" label="Event type" errors={errors}>
            <select {...input('type')} value={value.type} onChange={(e) => set('type', e.target.value as ListingFormValues['type'])}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field name="organizerType" label="Organizer type" errors={errors}>
            <select {...input('organizerType')} value={value.organizerType} onChange={(e) => set('organizerType', e.target.value as ListingFormValues['organizerType'])}>
              {ORGANIZER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field name="tagline" label="Tagline" hint="One short line in our own words." errors={errors}>
          <input {...input('tagline')} value={value.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={200} />
        </Field>
      </Section>

      <Section title="Registration">
        <Field name="registrationUrl" label="Registration link" hint="The official page students register on, or where the QR code points." errors={errors}>
          <input {...input('registrationUrl')} type="url" value={value.registrationUrl} onChange={(e) => set('registrationUrl', e.target.value)} placeholder="https://" />
        </Field>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="registrationVia" checked={value.registrationVia !== 'qr'} onChange={() => set('registrationVia', 'link')} className="h-4 w-4" />
            Register on a website
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="registrationVia" checked={value.registrationVia === 'qr'} onChange={() => set('registrationVia', 'qr')} className="h-4 w-4" />
            Register by QR code on the poster
          </label>
        </div>
      </Section>

      <Section title="When (India time)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field name="startDate" label="Starts" errors={errors}>
            <input {...input('startDate')} type="datetime-local" value={value.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field name="endDate" label="Ends" errors={errors}>
            <input {...input('endDate')} type="datetime-local" value={value.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
          <Field name="registrationDeadline" label="Registration deadline" errors={errors}>
            <input {...input('registrationDeadline')} type="datetime-local" value={value.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Where">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field name="mode" label="Mode" errors={errors}>
            <select {...input('mode')} value={value.mode} onChange={(e) => set('mode', e.target.value as ListingFormValues['mode'])}>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          {value.mode !== 'online' && (
            <>
              <Field name="city" label="City" hint="Sets the map point to the city centre." errors={errors}>
                {/* A new city means the old venue point is wrong, so the coordinates are cleared. */}
                <select {...input('city')} value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value, lat: '', lng: '' })}>
                  <option value="">Pick a city</option>
                  {CITIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                  <option value="other">Other city</option>
                </select>
              </Field>
              {value.city === 'other' ? (
                <Field name="cityName" label="City name" errors={errors}>
                  <input {...input('cityName')} value={value.cityName} onChange={(e) => set('cityName', e.target.value)} maxLength={60} />
                </Field>
              ) : (
                <Field name="country" label="Country" errors={errors}>
                  <input {...input('country')} value={value.country} onChange={(e) => set('country', e.target.value)} maxLength={60} />
                </Field>
              )}
            </>
          )}
        </div>
        {value.mode !== 'online' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <Field name="venue" label="Venue" errors={errors}>
              <input {...input('venue')} value={value.venue} onChange={(e) => set('venue', e.target.value)} maxLength={200} placeholder="Campus or address" />
            </Field>
            <Field name="lat" label="Latitude" hint="Optional exact venue point." errors={errors}>
              <input {...input('lat')} inputMode="decimal" value={value.lat} onChange={(e) => set('lat', e.target.value)} placeholder="18.52" />
            </Field>
            <Field name="lng" label="Longitude" errors={errors}>
              <input {...input('lng')} inputMode="decimal" value={value.lng} onChange={(e) => set('lng', e.target.value)} placeholder="73.85" />
            </Field>
          </div>
        )}
      </Section>

      <Section title="Who can join">
        <div className="grid grid-cols-3 gap-3">
          <Field name="teamMin" label="Min team" errors={errors}>
            <input {...input('teamMin')} type="number" min={1} max={20} value={value.teamMin} onChange={(e) => set('teamMin', e.target.value)} />
          </Field>
          <Field name="teamMax" label="Max team" errors={errors}>
            <input {...input('teamMax')} type="number" min={1} max={50} value={value.teamMax} onChange={(e) => set('teamMax', e.target.value)} />
          </Field>
          <Field name="fee" label="Entry fee (₹)" hint="0 when free." errors={errors}>
            <input {...input('fee')} type="number" min={0} value={value.fee} onChange={(e) => set('fee', e.target.value)} />
          </Field>
        </div>
        <div>
          <p className={labelClass}>Eligibility</p>
          <div className="flex flex-wrap gap-1.5">
            {ELIGIBILITY.map((el) => (
              <Chip key={el.value} on={value.eligibility.includes(el.value)} onClick={() => set('eligibility', toggle(value.eligibility, el.value))}>
                {el.label}
              </Chip>
            ))}
          </div>
          {errors.eligibility && <p className="mt-1 text-xs font-semibold">! {errors.eligibility}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.beginnerFriendly} onChange={(e) => set('beginnerFriendly', e.target.checked)} className="h-4 w-4" />
          Beginner-friendly
        </label>
      </Section>

      <Section title="Themes">
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => (
            <Chip key={t.slug} on={value.themes.includes(t.slug)} onClick={() => set('themes', toggle(value.themes, t.slug))}>
              {t.name}
            </Chip>
          ))}
        </div>
        {errors.themes && <p className="mt-1 text-xs font-semibold">! {errors.themes}</p>}
      </Section>

      <Section title="Prizes">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field name="prizePool" label="Prize pool" hint="Total cash, as a number." errors={errors}>
            <input {...input('prizePool')} type="number" min={0} value={value.prizePool} onChange={(e) => set('prizePool', e.target.value)} />
          </Field>
          <Field name="prizeCurrency" label="Currency" errors={errors}>
            <select {...input('prizeCurrency')} value={value.prizeCurrency} onChange={(e) => set('prizeCurrency', e.target.value as ListingFormValues['prizeCurrency'])}>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="prizes" label="Prize lines" hint="One per line, e.g. “Winner: ₹50,000”." errors={errors}>
            <textarea {...area('prizes')} value={value.prizes} onChange={(e) => set('prizes', e.target.value)} />
          </Field>
          <Field name="perks" label="Perks" hint="One per line, e.g. “Food and stay”." errors={errors}>
            <textarea {...area('perks')} value={value.perks} onChange={(e) => set('perks', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Banner, logo and summary">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Thumb src={value.imageUrl} className="h-24 w-40" />
          <div className="min-w-0 flex-1 space-y-2">
            <Field name="imageUrl" label="Banner image" hint="Upload one (stored on Cloudinary) or paste a link. Empty shows generated art." errors={errors}>
              <input {...input('imageUrl')} value={value.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://" />
            </Field>
            <div className="flex flex-wrap items-start gap-2">
              <UploadButton onUploaded={(url) => set('imageUrl', url)} />
              {value.imageUrl && (
                <Button size="sm" variant="ghost" onClick={() => set('imageUrl', '')}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
        <Field name="logoUrl" label="Logo link (optional)" errors={errors}>
          <input {...input('logoUrl')} value={value.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://" />
        </Field>
        <Field name="summary" label="Summary" hint="2–3 plain sentences in our own words. Leave empty to write one from the fields." errors={errors}>
          <textarea {...area('summary')} rows={5} value={value.summary} onChange={(e) => set('summary', e.target.value)} maxLength={1200} />
        </Field>
      </Section>

      {showFlags && (
        <Section title="On the site">
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={value.verified} onChange={(e) => set('verified', e.target.checked)} className="h-4 w-4" />
              Verified (checked by a person)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={value.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4" />
              Featured
            </label>
          </div>
        </Section>
      )}
    </div>
  );
}
