// Placeholder contact details and social links. Replace before launch.
export const siteConfig = {
  name: 'HackathonFinder',
  domain: 'HackathonFinder.in',
  tagline: 'Every hackathon. One place.',
  description:
    'HackathonFinder finds hackathons from Unstop, Devfolio, Google, Instagram, LinkedIn, Facebook, WhatsApp groups and more, and lists them in one place. Find the ones near you, and search by city, theme, deadline, team size and prize.',
  url: 'https://hackathonfinder.in',
  email: 'hello@hackathonfinder.in',
  social: {
    instagram: '#',
    linkedin: '#',
    facebook: '#',
    telegram: '#',
    whatsapp: '#',
    discord: '#',
  },
  /** WhatsApp group per city slug. Cities without one show as "starting soon". */
  cityGroups: {
    pune: '#',
  } as Record<string, string>,
};
