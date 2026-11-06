import { abs } from '@/lib/seo';
import { siteConfig } from '@/data/siteConfig';

export interface FeedItem {
  title: string;
  path: string;
  description: string;
  published: string;
}

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * A small RSS 2.0 feed. Readers, aggregators and AI crawlers use these to notice
 * new guides and briefings without re-crawling the whole site.
 */
export function rssFeed(opts: { title: string; description: string; path: string; items: FeedItem[] }): string {
  const updated = opts.items[0]?.published ?? new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(opts.title)}</title>
    <link>${xml(abs(opts.path))}</link>
    <description>${xml(opts.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${xml(abs(`${opts.path}/rss.xml`))}" rel="self" type="application/rss+xml" />
    <copyright>${xml(`© ${new Date().getFullYear()} ${siteConfig.name}`)}</copyright>
${opts.items
  .map(
    (item) => `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(abs(item.path))}</link>
      <guid isPermaLink="true">${xml(abs(item.path))}</guid>
      <description>${xml(item.description)}</description>
      <pubDate>${new Date(item.published).toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;
}
