import type { LucideIcon } from 'lucide-react';

/**
 * Sign-in pages: the pitch on one side, the form card on the other. On phones the pitch
 * shrinks to a short header above the form.
 */
export default function AuthShell({
  title,
  accent,
  description,
  perks = [],
  children,
}: {
  title: string;
  accent: string;
  description: string;
  perks?: { icon: LucideIcon; text: string }[];
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface py-8 sm:py-14">
      <div className="container-page">
        <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16">
          <aside className="lg:py-8">
            <h1 className="text-3xl sm:text-4xl">
              {title} <span className="text-muted">{accent}</span>
            </h1>
            <p className="mt-3 max-w-md text-base leading-7 text-muted">{description}</p>
            {perks.length > 0 && (
              <ul className="mt-8 hidden space-y-4 sm:block">
                {perks.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm leading-6 text-ink/80">
                    <span className="inline-flex shrink-0 rounded-md border border-line bg-card p-1.5 text-accent shadow-card">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </aside>
          <div className="card p-6 shadow-lift sm:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Short status line above a form: an error, or good news. */
export function FormNotice({ tone, children, id }: { tone: 'error' | 'success' | 'info'; children: React.ReactNode; id?: string }) {
  const styles = {
    error: 'border-danger/20 bg-danger-soft text-[#991b1b] dark:border-danger/30 dark:bg-danger/10 dark:text-red-200',
    success: 'border-success/20 bg-success-soft text-[#166534] dark:border-success/30 dark:bg-success/10 dark:text-green-200',
    info: 'border-line bg-ink/[0.03] text-ink/80',
  }[tone];
  return (
    <p id={id} role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}
