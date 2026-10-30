// Contact details, founder and social links. An empty link means we don't have that
// channel yet; it is hidden everywhere (see activeSocials).
export const siteConfig = {
  name: 'HackathonFinder',
  domain: 'HackathonFinder.in',
  tagline: 'Every hackathon. One place.',
  description:
    'HackathonFinder finds hackathons from Unstop, Devfolio, Devpost, MLH, Google, Instagram, LinkedIn and more, and lists them in one place. Find hackathons near you in India and search by city, theme, deadline, team size and prize.',
  url: 'https://www.hackathonfinder.in',
  email: 'hello@hackathonfinder.in',
  /** When the site went live; used in structured data. */
  foundingDate: '2026-10',
  founder: {
    name: 'Rohit Jadhav',
    role: 'Founder',
    email: 'rjdhav67@gmail.com',
    instagram: 'https://www.instagram.com/dev.by.rohit/',
    instagramHandle: 'dev.by.rohit',
    linkedin: 'https://www.linkedin.com/in/rohit-jadhav94/',
    github: 'https://github.com/rohit94r',
  },
  social: {
    instagram: 'https://www.instagram.com/dev.by.rohit/',
    linkedin: 'https://www.linkedin.com/in/rohit-jadhav94/',
    github: 'https://github.com/rohit94r',
    facebook: '',
    telegram: '',
    whatsapp: 'https://chat.whatsapp.com/DrKUp0GtWx9JLmAyX57rNX',
    discord: '',
  },
  /** WhatsApp group per city slug. Cities without one show as "starting soon". */
  cityGroups: {} as Record<string, string>,
};

export type SocialKey = keyof typeof siteConfig.social;

/** True for a real link (not empty or a "#" placeholder). */
export const isLiveLink = (href: string | undefined | null): href is string => Boolean(href && href !== '#');

/** The social channels that exist, in the order given. */
export function activeSocials<T extends { href: string }>(items: T[]): T[] {
  return items.filter((i) => isLiveLink(i.href));
}

/** Every profile that belongs to HackathonFinder or its founder (schema.org sameAs). */
export const sameAs = [...new Set(Object.values(siteConfig.social).filter(isLiveLink).filter((u) => !u.includes('chat.whatsapp.com')))];
