import type { ThemeSlug } from '@hackathonfinder/shared';
import { RESULT_LABELS, personByHandle, type ResultKind } from '@/data/people';

// Winning stories: labels and helpers shared by the wins pages. Stories live in the
// database (/api/wins). WINS is an old copy of the four sample students' stories (the
// seed in packages/db loads the real ones); only the WinStory helpers still use it.

export type WinResult = Exclude<ResultKind, 'participant'>;

export const WIN_RESULTS: WinResult[] = ['winner', 'runner-up', 'finalist'];

export interface WinSections {
  problem: string;
  /** What we built. */
  built: string;
  /** What the judges liked, or how we won. */
  won: string;
  /** Tips for other students. */
  lessons: string;
}

/** A sample story (see WINS). Live stories use WinItem from components/wins/model. */
export interface WinStory {
  id: string;
  /** A PEOPLE handle. */
  authorHandle: string;
  /** The hackathon's name. */
  hackathon: string;
  /** Only set when the hackathon is one of our listings. */
  hackathonSlug?: string;
  /** City slug from CITIES; empty for online events. */
  city?: string;
  result: WinResult;
  prize: string;
  projectName: string;
  tagline: string;
  themes: ThemeSlug[];
  techStack: string[];
  /** Team member names, author first. */
  team: string[];
  /** Paragraphs separated by blank lines. */
  sections: WinSections;
  links: { demo?: string; github?: string };
  daysAgo: number;
  cheers: number;
}

export const SECTION_TITLES: { key: keyof WinSections; title: string }[] = [
  { key: 'problem', title: 'The problem' },
  { key: 'built', title: 'What we built' },
  { key: 'won', title: 'How we won' },
  { key: 'lessons', title: 'Tips for your next hackathon' },
];

export const WINS: WinStory[] = [
  {
    id: 'floodwatch-monsoon-hack-2026',
    authorHandle: 'aarav-patil',
    hackathon: 'Monsoon Hack 2026',
    result: 'finalist',
    prize: 'Top 10 finalist + mentor session',
    projectName: 'FloodWatch',
    tagline: 'Crowd-reported waterlogging alerts for your daily commute.',
    themes: ['climate', 'smart-cities'],
    techStack: ['Next.js', 'Supabase', 'PostGIS', 'Telegram Bot API', 'Python'],
    team: ['Aarav Patil', 'Rutuja More', 'Siddharth Naik'],
    sections: {
      problem:
        'In a Pune monsoon an underpass can flood in half an hour, and most commuters find out when they are already stuck in it. Official updates arrive too late to change your route.',
      built:
        'A Telegram bot: send a photo and your location, pick the water depth (ankle, knee or waist) and it pins the report on a live map. Anyone who saved a route through that spot gets an alert.\n\nReports expire after three hours unless someone confirms them, so the map doesn’t fill up with old floods. We seeded it with 40 known waterlogging spots from news reports so it wasn’t empty on day one.',
      won:
        'We made the top 10 out of about 180 teams but not the top three. The judges loved the problem and the Telegram-first idea (no app to install), but asked two things we couldn’t answer well: how do you stop fake reports, and why would the first users join an empty map?\n\nThe winning team had a housing society ready to pilot their project. That told us what “ready” looks like.',
      lessons:
        'If people can post to your app, have an answer for spam and fake posts before the judges ask.\n\nFor online hackathons, the video is your pitch. Ours was three minutes; it should have been two, with the demo in the first 30 seconds.\n\nAsk for feedback after the results. Our mentor session was worth more than the certificate.',
    },
    links: { github: 'https://github.com' },
    daysAgo: 24,
    cheers: 96,
  },
  {
    id: 'dukaanpay-gujarat-fintech-day',
    authorHandle: 'dev-shah',
    hackathon: 'Gujarat Fintech Day',
    city: 'ahmedabad',
    result: 'runner-up',
    prize: '₹25,000 + mentorship from a payments startup',
    projectName: 'DukaanPay',
    tagline: 'Udhaar tracking and polite UPI reminders for kirana shops.',
    themes: ['fintech', 'web-dev'],
    techStack: ['Flutter', 'Firebase', 'Cloud Functions', 'UPI deep links'],
    team: ['Dev Shah', 'Hetal Patel', 'Jay Parmar'],
    sections: {
      problem:
        'Every kirana shop near our college gives udhaar (credit) to regular customers and writes it in a notebook. Shopkeepers lose track, and asking a regular to pay up feels awkward.\n\nThe apps that exist are in English and packed with features most shopkeepers never use.',
      built:
        'A Gujarati-first Flutter app. The shopkeeper says “Ramesh bhai 240” and the entry is added. The customer gets a WhatsApp message with a UPI link to pay, and a polite weekly reminder if it’s still open.\n\nIt works offline and syncs when the shop’s phone gets signal, because half the shops we visited had patchy network inside.',
      won:
        'We tested it with four shops in Maninagar the week before, and two were still using it on hackathon day. A real shopkeeper quote on our slide got the room’s attention.\n\nWe came second because our business model was thin. When a judge asked who pays for this, we didn’t have a clear answer. Fair feedback.',
      lessons:
        'Even for a social project, have a one-line answer to “who pays?”.\n\nOffline-first and local language are features in India, not extras. Say so in your pitch.\n\nA week of real use beats any mockup. Go and visit the shops.',
    },
    links: { demo: 'https://example.com', github: 'https://github.com' },
    daysAgo: 52,
    cheers: 141,
  },
  {
    id: 'saferoute-design-sprint-pune',
    authorHandle: 'sneha-kulkarni',
    hackathon: 'Design Sprint Pune',
    city: 'pune',
    result: 'runner-up',
    prize: '₹15,000 + design tool licences',
    projectName: 'SafeRoute',
    tagline: 'Walking routes rated by women, for women, after dark.',
    themes: ['smart-cities', 'social-impact'],
    techStack: ['Figma', 'Maze', 'Mapbox', 'React', 'Firebase'],
    team: ['Sneha Kulkarni', 'Riddhi Shinde', 'Aman Verma'],
    sections: {
      problem:
        'Women students walking from the bus stop to their PG or coaching class after 8 pm don’t want the shortest route. They want the one with working streetlights, open shops and people around. Maps don’t know any of that.',
      built:
        'In the two-day sprint we interviewed 14 women students and drew their evening journeys on a wall. Our prototype lets you rate a stretch of road on lighting, crowd and open shops, then suggests a route that favours well-lit, busy streets.\n\nThere is also a “walk with me” button that shares your live route with two friends until you reach.',
      won:
        'We showed our research wall first: journey maps and real quotes. Then our usability numbers: on the first version only 4 of 6 testers could share a route; after one round of changes, all 6 could.\n\nWe came second to a team that had also built a working app. Next time we’ll pair up with a developer earlier.',
      lessons:
        'In design sprints, show the process, not just the final screens. Judges want to see why you made each decision.\n\nTest with five or six people as early as you can. Your first version is always confusing somewhere.\n\nCheck colour contrast and tap sizes. One judge tested our screens in sunlight on her phone.',
    },
    links: { demo: 'https://example.com' },
    daysAgo: 81,
    cheers: 188,
  },
  {
    id: 'notequiz-ai-deccan-hack-2025',
    authorHandle: 'aarav-patil',
    hackathon: 'Deccan Hack 2025',
    city: 'pune',
    result: 'winner',
    prize: '₹30,000 + internship interviews',
    projectName: 'NoteQuiz AI',
    tagline: 'Turn your class notes into practice quizzes before exams.',
    themes: ['edtech', 'ai-ml'],
    techStack: ['Python', 'FastAPI', 'PaddleOCR', 'sentence-transformers', 'PostgreSQL', 'React Native'],
    team: ['Aarav Patil', 'Tanvi Gokhale', 'Omkar Jadhav'],
    sections: {
      problem:
        'Before university exams most of us study from photocopied handwritten notes and previous year papers. There is no easy way to test yourself on your own notes, so you just re-read them and hope.',
      built:
        'Photograph your notes and NoteQuiz AI reads the handwriting, splits it by topic and writes multiple-choice and short-answer questions. It then plans revision rounds that end on your exam date.\n\nWe also matched each topic to five years of previous papers, so you see “this came up 4 times” next to the question.',
      won:
        'Some judges were professors, so we borrowed a junior’s notes for one of their subjects and generated a quiz from them live. The previous-paper matching got the biggest reaction.\n\nHandwriting recognition was still weak, and we said so. We showed a quick “fix the text” step instead of hiding it.',
      lessons:
        'Pick a problem you have yourself. You will know the details judges ask about.\n\nHandwriting OCR is hard. Budget time for it, or start with printed notes.\n\nKeep the backend boring and solid, and spend your polish on the one screen you demo.',
    },
    links: { github: 'https://github.com' },
    daysAgo: 170,
    cheers: 158,
  },
];

export function winsByAuthor(handle: string): WinStory[] {
  return WINS.filter((w) => w.authorHandle === handle);
}

export interface WinAuthor {
  name: string;
  about: string;
  college: string;
  city: string;
  /** Where the author's profile lives. */
  href: string;
}

export function storyAuthor(story: WinStory): WinAuthor {
  const person = personByHandle(story.authorHandle);
  if (person) {
    return { name: person.name, about: person.about, college: person.college, city: person.city, href: `/u/${person.handle}` };
  }
  return { name: story.authorHandle, about: '', college: '', city: '', href: '/wins' };
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function postedLabel(daysAgo: number): string {
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 14) return `${daysAgo} days ago`;
  if (daysAgo < 60) return `${Math.round(daysAgo / 7)} weeks ago`;
  return `${Math.round(daysAgo / 30)} months ago`;
}

/** e.g. "Winner at Capital Hack 2026" */
export function resultLine(story: Pick<WinStory, 'result' | 'hackathon'>): string {
  return `${RESULT_LABELS[story.result]} at ${story.hackathon}`;
}
