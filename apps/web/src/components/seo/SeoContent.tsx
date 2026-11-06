import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ListingCopy } from '@/lib/listingCopy';

/** Server-rendered copy and FAQ block for listing pages, so crawlers that do not run JS still get the context. */
export default function SeoContent({
  copy,
  links,
  className,
}: {
  copy: ListingCopy;
  links?: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <section className={className ?? 'mt-12 border-t border-ink/10 pt-10'}>
      <h2 className="text-2xl font-bold sm:text-3xl">{copy.title}</h2>
      <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-7 text-ink/75">
        {copy.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      {links && links.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="card flex items-center justify-between gap-3 p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lift">
              {l.label}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {copy.faqs.length > 0 && (
        <>
          <h2 className="mt-10 text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          <dl className="mt-4 max-w-3xl space-y-5">
            {copy.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1 text-[15px] leading-7 text-ink/75">{f.a}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
