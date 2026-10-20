export type CategorySlug = 'brief' | 'thinking' | 'playbook' | 'decisions' | 'deep-dive';

export interface Category {
  slug: CategorySlug;
  name: string;
  summary: string;
  example: string;
}

export const categories: Category[] = [
  {
    slug: 'brief',
    name: 'Brief',
    summary:
      'Short news briefs on deals, investments and M&A. What happened, why it matters and what to watch next, in under two minutes.',
    example: 'Deal, investment and M&A briefs',
  },
  {
    slug: 'thinking',
    name: 'Thinking',
    summary:
      'Leadership and strategy essays that take a familiar assumption and show where it quietly breaks.',
    example: 'Momentum Can Hide Strategic Drift',
  },
  {
    slug: 'playbook',
    name: 'Playbook',
    summary:
      'How-to frameworks an executive can put to work on Monday morning, laid out step by step.',
    example: 'Building Resilient Organizations',
  },
  {
    slug: 'decisions',
    name: 'Decisions',
    summary:
      'One hard question per post. Both sides argued properly, then a clear recommendation.',
    example: 'Should You Conquer One Market Before Entering Ten?',
  },
  {
    slug: 'deep-dive',
    name: 'Deep Dive',
    summary:
      'Company analyses that go past the press release, including companies your readers have not studied yet.',
    example: 'Company analyses: Nvidia, ServiceNow, Zerodha, Razorpay',
  },
];

export interface Agent {
  id: string;
  name: string;
  role: string;
  output: string;
}

export const agents: Agent[] = [
  {
    id: 'finder',
    name: 'News Finder',
    role: 'Scans the sources you approve, sorts stories by category, removes duplicates and ranks them by relevance.',
    output: 'Ranked topics',
  },
  {
    id: 'research',
    name: 'Research',
    role: 'Digs for the non-obvious angle and collects the sources behind it.',
    output: 'Research notes',
  },
  {
    id: 'writer',
    name: 'Writer',
    role: 'Writes in your persona, using the paragraph framework for each category.',
    output: 'Draft post',
  },
  {
    id: 'value-check',
    name: 'Value Check',
    role: 'Asks one question: does this add value to an executive? Weak drafts go back for up to two rewrites.',
    output: 'Approved draft',
  },
  {
    id: 'seo',
    name: 'SEO + Formatter',
    role: 'Checks competitor content and keywords, writes the title, meta and slug, formats the post and adds internal links.',
    output: 'Publish-ready post',
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    role: 'Picks the best publish date and time and adds the post to the queue.',
    output: 'Queue entry',
  },
  {
    id: 'publisher',
    name: 'Publisher',
    role: 'Publishes to your website and reformats the same post for LinkedIn.',
    output: 'Live on web + LinkedIn',
  },
];

export type NewsStatus = 'New' | 'Sent to writer' | 'Skipped';

export interface NewsItem {
  id: string;
  headline: string;
  category: CategorySlug;
  source: string;
  foundAgo: string;
  relevance: number;
  status: NewsStatus;
}

// Sample items for the demo. Real items arrive once sources are connected.
export const sampleNews: NewsItem[] = [
  {
    id: 'n1',
    headline: 'Gulf sovereign fund leads a $2B round in a regional logistics platform',
    category: 'brief',
    source: 'RSS · Markets',
    foundAgo: '12 min ago',
    relevance: 94,
    status: 'Sent to writer',
  },
  {
    id: 'n2',
    headline: 'Asian automaker commits a multibillion-dollar budget to new battery plants',
    category: 'brief',
    source: 'Search API',
    foundAgo: '38 min ago',
    relevance: 88,
    status: 'New',
  },
  {
    id: 'n3',
    headline: 'Private-equity buyouts of mid-market software firms hit a quarterly high',
    category: 'brief',
    source: 'RSS · Deals',
    foundAgo: '1 h ago',
    relevance: 71,
    status: 'New',
  },
  {
    id: 'n4',
    headline: 'Why fast-growing companies stop questioning their strategy',
    category: 'thinking',
    source: 'Search API',
    foundAgo: '2 h ago',
    relevance: 90,
    status: 'Sent to writer',
  },
  {
    id: 'n5',
    headline: 'The hidden cost of consensus in leadership teams',
    category: 'thinking',
    source: 'RSS · Management',
    foundAgo: '3 h ago',
    relevance: 76,
    status: 'New',
  },
  {
    id: 'n6',
    headline: 'Running a 90-day turnaround: what the first two weeks should look like',
    category: 'playbook',
    source: 'RSS · Management',
    foundAgo: '3 h ago',
    relevance: 83,
    status: 'New',
  },
  {
    id: 'n7',
    headline: 'Building a succession bench before you need one',
    category: 'playbook',
    source: 'Search API',
    foundAgo: '5 h ago',
    relevance: 64,
    status: 'Skipped',
  },
  {
    id: 'n8',
    headline: 'Build or buy: when acquiring a capability beats developing it',
    category: 'decisions',
    source: 'Search API',
    foundAgo: '6 h ago',
    relevance: 92,
    status: 'Sent to writer',
  },
  {
    id: 'n9',
    headline: 'Should a market leader cut prices before a new entrant does?',
    category: 'decisions',
    source: 'RSS · Strategy',
    foundAgo: '7 h ago',
    relevance: 79,
    status: 'New',
  },
  {
    id: 'n10',
    headline: 'How a bootstrapped software company outgrew its venture-backed rivals',
    category: 'deep-dive',
    source: 'Search API',
    foundAgo: '8 h ago',
    relevance: 95,
    status: 'Sent to writer',
  },
  {
    id: 'n11',
    headline: 'What a discount broker’s pricing model teaches incumbents',
    category: 'deep-dive',
    source: 'RSS · Tech',
    foundAgo: '9 h ago',
    relevance: 81,
    status: 'New',
  },
  {
    id: 'n12',
    headline: 'Quarterly earnings roundup for consumer-goods companies',
    category: 'brief',
    source: 'RSS · Markets',
    foundAgo: '11 h ago',
    relevance: 42,
    status: 'Skipped',
  },
];

export type QueueStatus = 'Published' | 'Scheduled' | 'In review';

export interface QueueItem {
  id: string;
  title: string;
  category: CategorySlug;
  channel: 'Website' | 'LinkedIn';
  scheduledFor: string;
  status: QueueStatus;
}

// Sample queue for the demo.
export const sampleQueue: QueueItem[] = [
  {
    id: 'q1',
    title: 'Gulf sovereign fund backs regional logistics',
    category: 'brief',
    channel: 'Website',
    scheduledFor: 'Wed 21 Oct, 08:30',
    status: 'Published',
  },
  {
    id: 'q2',
    title: 'Gulf sovereign fund backs regional logistics',
    category: 'brief',
    channel: 'LinkedIn',
    scheduledFor: 'Wed 21 Oct, 12:00',
    status: 'Published',
  },
  {
    id: 'q3',
    title: 'Build or buy: when acquiring a capability wins',
    category: 'decisions',
    channel: 'Website',
    scheduledFor: 'Thu 22 Oct, 09:00',
    status: 'Scheduled',
  },
  {
    id: 'q4',
    title: 'Build or buy: when acquiring a capability wins',
    category: 'decisions',
    channel: 'LinkedIn',
    scheduledFor: 'Thu 22 Oct, 13:00',
    status: 'Scheduled',
  },
  {
    id: 'q5',
    title: 'The bootstrapped company that outgrew its rivals',
    category: 'deep-dive',
    channel: 'Website',
    scheduledFor: 'Fri 23 Oct, 09:00',
    status: 'In review',
  },
  {
    id: 'q6',
    title: 'Why fast-growing companies stop questioning strategy',
    category: 'thinking',
    channel: 'Website',
    scheduledFor: 'Mon 26 Oct, 09:00',
    status: 'In review',
  },
];

export function categoryName(slug: CategorySlug): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}
