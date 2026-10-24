import type { LucideIcon } from 'lucide-react';
import NightSky from '@/components/art/NightSky';
import Sticker from '@/components/art/Sticker';

/**
 * Sign-in pages: a night-sky panel with the pitch on one side, the form card on the
 * other. On phones the panel shrinks to a short header above the form.
 */
export default function AuthShell({
  title,
  accent,
  description,
  perks = [],
  sticker,
  children,
}: {
  title: string;
  accent: string;
  description: string;
  perks?: { icon: LucideIcon; text: string }[];
  sticker?: { text: string; tone?: 'green' | 'yellow' | 'turquoise' };
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface py-6 sm:py-12">
      <div className="container-page">
        <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6">
          <aside className="on-dark noir relative overflow-hidden rounded-[20px] bg-ink px-6 py-8 sm:p-9">
            <NightSky className="z-0" />
            {sticker && (
              <Sticker text={sticker.text} tone={sticker.tone ?? 'yellow'} className="right-5 top-5 hidden rotate-6 sm:inline-flex" />
            )}
            <div className="relative z-[3] flex h-full flex-col">
              <h1 className="hf-rise text-4xl text-surface sm:text-5xl">{title}</h1>
              <p
                className="hf-rise font-display text-4xl leading-[0.95] tracking-tight text-neon sm:text-5xl"
                style={{ ['--d' as string]: '120ms' }}
              >
                {accent}
              </p>
              <p className="hf-rise mt-4 max-w-md text-sm leading-6 text-surface/80 sm:text-base" style={{ ['--d' as string]: '240ms' }}>
                {description}
              </p>
              {perks.length > 0 && (
                <ul className="mt-6 hidden space-y-3 sm:block">
                  {perks.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3 text-sm text-surface/90">
                      <span className="inline-flex shrink-0 rounded-lg bg-accent p-1.5 text-white">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
          <div className="card p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Short status line above a form: an error, or good news. */
export function FormNotice({ tone, children, id }: { tone: 'error' | 'success' | 'info'; children: React.ReactNode; id?: string }) {
  const styles = {
    error: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-400/25 dark:bg-brand-500/10 dark:text-brand-100',
    success: 'border-ink/15 bg-card text-ink',
    info: 'border-ink/10 bg-ink/5 text-ink/80',
  }[tone];
  return (
    <p id={id} role={tone === 'error' ? 'alert' : 'status'} className={`rounded-[14px] border px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}
