// Search and AI-answer-engine helpers: absolute URLs, canonical metadata and
// schema.org JSON-LD for the organisation, breadcrumbs, events, articles and FAQs.

import type { Metadata } from 'next';
import { cityName, type Hackathon } from '@hackathonfinder/shared';
import { sameAs, siteConfig } from '@/data/siteConfig';

/** An absolute URL on the site, e.g. abs('/blog') → https://hackathonfinder.in/blog. */
export function abs(path = '/'): string {
  return new URL(path, siteConfig.url).toString();
}

/** Search results cut the title around 60 characters; wide glyphs cut it sooner. */
const TITLE_LIMIT = 60;

/**
 * Next appends "· HackathonFinder" from the root layout template. When that would
 * push the tag past the limit, send the title absolute so the useful words survive
 * instead of being truncated mid-phrase.
 */
function resolvedTitle(title: string): Metadata['title'] {
  return `${title} · ${siteConfig.name}`.length > TITLE_LIMIT ? { absolute: title } : title;
}

/**
 * Search snippets cut around 155–160 characters. Trim at a word boundary so the
 * description never gets chopped mid-word, and never invent a shorter one.
 */
function metaDescription(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 158) return clean;
  const cut = clean.slice(0, 158);
  const space = cut.lastIndexOf(' ');
  const kept = (space > 120 ? cut.slice(0, space) : cut).replace(/[.,;:!?\-–—]+$/, '');
  return `${kept}…`;
}

/**
 * Metadata for an indexable page: title, description, canonical URL and matching
 * Open Graph / Twitter tags (Next merges these with the root layout's defaults).
 * Non-article pages fall back to the site-wide social card, so every shared link
 * has an image even when the page has no artwork of its own.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const url = abs(opts.path);
  const description = metaDescription(opts.description);
  const images = opts.image
    ? [{ url: opts.image }]
    : opts.type === 'article'
      ? undefined
      : [{ url: abs('/opengraph-image'), width: 1200, height: 630, alt: `${siteConfig.name}: ${opts.title}` }];
  return {
    title: resolvedTitle(opts.title),
    description,
    keywords: opts.keywords,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: siteConfig.name,
      locale: 'en_IN',
      type: opts.type ?? 'website',
      ...(opts.type === 'article' ? { publishedTime: opts.publishedTime, modifiedTime: opts.modifiedTime, authors: [siteConfig.founder.name] } : {}),
      ...(images ? { images } : {}),
    },
    twitter: { card: 'summary_large_image', title: opts.title, description, ...(images ? { images: images.map((i) => i.url) } : {}) },
  };
}

/** Renders JSON-LD. `<` is escaped so text from listings can't close the script tag. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export const ORG_ID = `${siteConfig.url}/#organization`;
export const FOUNDER_ID = `${siteConfig.url}/about#founder`;
export const COFOUNDER_ID = `${siteConfig.url}/about#co-founder`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

export function founderJsonLd() {
  const f = siteConfig.founder;
  return {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: f.name,
    jobTitle: `${f.role}, ${siteConfig.name}`,
    email: `mailto:${f.email}`,
    url: abs('/about'),
    sameAs: [f.linkedin, f.github, f.instagram],
    worksFor: { '@id': ORG_ID },
  };
}

export function coFounderJsonLd() {
  const c = siteConfig.coFounder;
  return {
    '@type': 'Person',
    '@id': COFOUNDER_ID,
    name: c.name,
    jobTitle: `${c.role}, ${siteConfig.name}`,
    email: `mailto:${c.email}`,
    url: abs('/about'),
    sameAs: [c.linkedin, c.github, c.website],
    worksFor: { '@id': ORG_ID },
  };
}

/** The organisation, its founders and the site, sent on every page from the root layout. */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: siteConfig.name,
        alternateName: [siteConfig.domain, 'Hackathon Finder'],
        url: siteConfig.url,
        logo: { '@type': 'ImageObject', url: abs('/icon.svg') },
        description: siteConfig.description,
        email: `mailto:${siteConfig.email}`,
        foundingDate: siteConfig.foundingDate,
        founder: [{ '@id': FOUNDER_ID }, { '@id': COFOUNDER_ID }],
        sameAs,
        contactPoint: [
          { '@type': 'ContactPoint', contactType: 'customer support', email: siteConfig.email, availableLanguage: ['English', 'Hindi'] },
        ],
      },
      founderJsonLd(),
      coFounderJsonLd(),
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: siteConfig.name,
        url: siteConfig.url,
        inLanguage: 'en',
        description: siteConfig.description,
        publisher: { '@id': ORG_ID },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${siteConfig.url}/hackathons?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/** A breadcrumb trail; the first crumb (Home) is added for you. */
export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  const all = [{ name: 'Home', path: '/' }, ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function articleJsonLd(post: {
  slug: string;
  title: string;
  excerpt: string;
  published: string;
  modified?: string;
  keywords?: string[];
  category: string;
  /** Defaults to /blog/[slug]; wins stories pass their own path. */
  path?: string;
  type?: 'BlogPosting' | 'Article';
}) {
  const url = abs(post.path ?? `/blog/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': post.type ?? 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published,
    dateModified: post.modified ?? post.published,
    inLanguage: 'en',
    articleSection: post.category,
    keywords: post.keywords?.join(', '),
    // The per-post card's URL carries a build hash, so structured data uses the site card.
    image: abs('/opengraph-image'),
    author: [
      { '@type': 'Person', name: siteConfig.founder.name, url: abs('/about#founder') },
      { '@type': 'Organization', name: `${siteConfig.name} Team`, url: siteConfig.url },
    ],
    publisher: { '@id': ORG_ID },
  };
}

/** schema.org Blog for the guides index. */
export function blogListJsonLd(posts: { slug: string; title: string; published: string; modified?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': abs('/blog#blog'),
    name: `Hackathon guides · ${siteConfig.name}`,
    description: 'Practical guides on finding, building for, pitching and winning hackathons.',
    url: abs('/blog'),
    publisher: { '@id': ORG_ID },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: abs(`/blog/${p.slug}`),
      datePublished: p.published,
      dateModified: p.modified ?? p.published,
    })),
  };
}

/** schema.org NewsArticle for a briefing in the news section. */
export function newsArticleJsonLd(post: {
  slug: string;
  title: string;
  dek: string;
  category: string;
  published: string;
  modified?: string;
  keywords?: string[];
}) {
  const url = abs(`/news/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: post.title,
    description: post.dek,
    datePublished: post.published,
    dateModified: post.modified ?? post.published,
    inLanguage: 'en',
    articleSection: post.category,
    keywords: post.keywords?.join(', '),
    image: abs('/opengraph-image'),
    author: [
      { '@type': 'Person', name: siteConfig.founder.name, url: abs('/about#founder') },
      { '@type': 'Organization', name: `${siteConfig.name} Team`, url: siteConfig.url },
    ],
    publisher: { '@id': ORG_ID },
  };
}

/** The news hub as a collection of article links. */
export function newsListJsonLd(posts: { slug: string; title: string; published: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': abs('/news#collection'),
    name: `Tech news & trends · ${siteConfig.name}`,
    description: 'AI, skills and market briefings for student builders, plus what is moving in hackathons.',
    url: abs('/news'),
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(`/news/${p.slug}`),
        name: p.title,
      })),
    },
  };
}

export function eventJsonLd(h: Hackathon & { status?: string }) {
  const online = h.mode === 'online';
  const place = {
    '@type': 'Place',
    name: h.venue || cityName(h.city, h.cityName) || 'India',
    address: { '@type': 'PostalAddress', addressLocality: cityName(h.city, h.cityName) || undefined, addressCountry: h.country || 'IN' },
    ...(h.lat && h.lng ? { geo: { '@type': 'GeoCoordinates', latitude: h.lat, longitude: h.lng } } : {}),
  };
  const virtual = { '@type': 'VirtualLocation', url: h.registrationUrl };
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: h.title,
    description: h.summary || h.tagline,
    url: abs(`/hackathons/${h.slug}`),
    startDate: h.startDate,
    endDate: h.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : h.mode === 'hybrid'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location: online ? virtual : h.mode === 'hybrid' ? [place, virtual] : place,
    ...(h.imageUrl ? { image: [h.imageUrl] } : {}),
    organizer: { '@type': 'Organization', name: h.organizer || 'Organizer', url: h.registrationUrl },
    offers: {
      '@type': 'Offer',
      url: h.registrationUrl,
      price: h.fee ?? 0,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      validThrough: h.registrationDeadline,
    },
    isAccessibleForFree: !h.fee,
  };
}

/** An ItemList of listing pages, for city, theme and listing hubs. */
export function itemListJsonLd(name: string, items: { slug: string; title: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((h, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/hackathons/${h.slug}`), name: h.title })),
  };
}
