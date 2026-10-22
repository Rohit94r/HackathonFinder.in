'use client';

import { CITIES, ELIGIBILITY, EVENT_TYPES, MODES, THEMES } from '@hackathonfinder/shared';
import { cn } from '@/lib/cn';
import { ORGANIZER_TYPES, type ListingFormValues } from './listingFields';

type Errors = Record<string, string>;

function Field({ name, label, hint, errors, children, className }: { name: string; label: string; hint?: string; errors: Errors; children: React.ReactNode; className?: string }) {
  const error = errors[name];
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={`le-${name}`} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
      {error && (
        <p id={`le-${name}-error`} className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-ink/10 pt-5 first:border-0 first:pt-0">
      <legend className="float-left mb-1 w-full text-base font-bold text-ink">{title}</legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
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
    className: cn('input', errors[name] && 'border-red-400'),
  });
  const toggle = <T extends string>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <div className="space-y-6">
      <Section title="The basics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <Section title="When (India time)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field name="startDate" label="Starts" errors={errors}>
            <input {...input('startDate')} type="datetime-local" value={value.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field name="endDate" label="Ends" errors={errors}>
            <input {...input('endDate')} type="datetime-local" value={value.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
          <Field name="registrationDeadline" label="Registration deadline" errors={errors}>
            <input
              {...input('registrationDeadline')}
              type="datetime-local"
              value={value.registrationDeadline}
              onChange={(e) => set('registrationDeadline', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Where">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
          <p className="label">Eligibility</p>
          <div className="flex flex-wrap gap-2">
            {ELIGIBILITY.map((el) => {
              const on = value.eligibility.includes(el.value);
              return (
                <button key={el.value} type="button" aria-pressed={on} onClick={() => set('eligibility', toggle(value.eligibility, el.value))} className={cn('chip text-xs', on && 'chip-active')}>
                  {el.label}
                </button>
              );
            })}
          </div>
          {errors.eligibility && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.eligibility}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={value.beginnerFriendly} onChange={(e) => set('beginnerFriendly', e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Beginner-friendly
        </label>
      </Section>

      <Section title="Themes">
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => {
            const on = value.themes.includes(t.slug);
            return (
              <button key={t.slug} type="button" aria-pressed={on} onClick={() => set('themes', toggle(value.themes, t.slug))} className={cn('chip text-xs', on && 'chip-active')}>
                {t.name}
              </button>
            );
          })}
        </div>
        {errors.themes && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.themes}</p>}
      </Section>

      <Section title="Prizes">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field name="prizes" label="Prize lines" hint="One per line, e.g. “Winner: ₹50,000”." errors={errors}>
            <textarea {...input('prizes')} className={cn('input min-h-[90px]', errors.prizes && 'border-red-400')} value={value.prizes} onChange={(e) => set('prizes', e.target.value)} />
          </Field>
          <Field name="perks" label="Perks" hint="One per line, e.g. “Food and stay”." errors={errors}>
            <textarea {...input('perks')} className={cn('input min-h-[90px]', errors.perks && 'border-red-400')} value={value.perks} onChange={(e) => set('perks', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Links, image and summary">
        <Field name="registrationUrl" label="Registration link" hint="The official page students register on." errors={errors}>
          <input {...input('registrationUrl')} type="url" value={value.registrationUrl} onChange={(e) => set('registrationUrl', e.target.value)} placeholder="https://" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <Field name="imageUrl" label="Image URL" hint="Banner or poster. Leave empty for generated art." errors={errors}>
            <input {...input('imageUrl')} value={value.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https:// or /uploads/…" />
          </Field>
          {value.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.imageUrl} alt="" className="h-20 w-32 rounded-lg object-cover ring-1 ring-ink/10 sm:mt-6" />
          )}
        </div>
        <Field name="logoUrl" label="Logo URL (optional)" errors={errors}>
          <input {...input('logoUrl')} value={value.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://" />
        </Field>
        <Field name="summary" label="Summary" hint="2–3 plain sentences in our own words. Leave empty to write one from the fields." errors={errors}>
          <textarea {...input('summary')} className={cn('input min-h-[110px]', errors.summary && 'border-red-400')} value={value.summary} onChange={(e) => set('summary', e.target.value)} maxLength={1200} />
        </Field>
      </Section>

      {showFlags && (
        <Section title="On the site">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input type="checkbox" checked={value.verified} onChange={(e) => set('verified', e.target.checked)} className="h-4 w-4 accent-brand-600" />
              Verified (checked by a person)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input type="checkbox" checked={value.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 accent-brand-600" />
              Featured
            </label>
          </div>
        </Section>
      )}
    </div>
  );
}
