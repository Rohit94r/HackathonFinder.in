import type { ThemeSlug } from '@hackathonfinder/shared';
import { RESULT_LABELS, personByHandle, type ResultKind } from './people';

// Winning stories: students write up how they won (or made the finals), so others can
// learn from it. The samples match the records in `@/data/people`; stories a student
// posts are kept in this browser (key below) until accounts launch.

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

export interface WinStory {
  id: string;
  /** A PEOPLE handle, or the student's own handle on stories posted in this browser. */
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

/** A story posted in this browser: it carries a snapshot of its author. */
export interface MyWinStory extends WinStory {
  postedAt: string;
  author: { name: string; about: string; college: string; city: string };
}

export const MY_WINS_KEY = 'hf_wins_v1';
export const WIN_CHEERS_KEY = 'hf_win_cheers_v1';

export const SECTION_TITLES: { key: keyof WinSections; title: string }[] = [
  { key: 'problem', title: 'The problem' },
  { key: 'built', title: 'What we built' },
  { key: 'won', title: 'How we won' },
  { key: 'lessons', title: 'Tips for your next hackathon' },
];

export const WINS: WinStory[] = [
  {
    id: 'rentright-capital-hack-2026',
    authorHandle: 'ananya-sharma',
    hackathon: 'Capital Hack 2026',
    city: 'delhi-ncr',
    result: 'winner',
    prize: '₹50,000 + incubation interview',
    projectName: 'RentRight',
    tagline: 'Spot unfair clauses in a rent agreement before you sign it.',
    themes: ['smart-cities', 'ai-ml'],
    techStack: ['Next.js', 'FastAPI', 'Tesseract OCR', 'PostgreSQL', 'Tailwind CSS'],
    team: ['Ananya Sharma', 'Kunal Mehta', 'Pooja Bisht'],
    sections: {
      problem:
        'Students and first-jobbers moving to Delhi NCR sign 11-month rent agreements on stamp paper, usually the same day the broker shows the flat. Nobody reads the clauses on lock-in, painting charges or deposit deductions.\n\nIn our own hostel group, three of five seniors had lost part of their deposit to a clause they never noticed. That was our problem statement, and every judge had a story like it.',
      built:
        'You take a phone photo of your agreement. RentRight reads it with OCR, splits it into clauses and checks each one against 14 risky patterns: a deposit above two months, a lock-in longer than six months, flat painting deductions, rent hikes with no notice, and more.\n\nEach flag comes with a plain-language explanation in English or Hindi and the questions to ask your landlord. The checks are simple rules we wrote ourselves; we only used a language model to explain the clause, never to decide whether it was risky.',
      won:
        'We opened the demo with a real (anonymised) agreement from a teammate’s PG and RentRight flagged the deposit clause live. Then one slide: we had collected 23 agreements from seniors in two days, and 17 had at least one risky clause.\n\nThe hardest question was “what if you’re wrong?”. We had practised it: we don’t give legal advice, we point to the exact clause and the relevant section of the Model Tenancy Act, and we say so on every screen. The judges said that answer was why we won.',
      lessons:
        'Get real data in the first few hours. A message in your college WhatsApp groups gets you more than any public dataset.\n\nKeep the core logic something you can explain on a whiteboard, and use AI for the language around it. It is far easier to defend in Q&A.\n\nCut features early. We dropped landlord ratings at midnight and spent that time on the demo, which was the right call.',
    },
    links: { demo: 'https://example.com', github: 'https://github.com' },
    daysAgo: 18,
    cheers: 312,
  },
  {
    id: 'floodwatch-monsoon-hack-2026',
    authorHandle: 'aarav-patil',
    hackathon: 'Monsoon Hack 2026',
    hackathonSlug: 'monsoon-hack-2026',
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
    id: 'heatmap-india-climate-data-hack-2025',
    authorHandle: 'ishita-reddy',
    hackathon: 'Climate Data Hack 2025',
    city: 'hyderabad',
    result: 'winner',
    prize: '₹60,000 + cloud credits',
    projectName: 'HeatMap India',
    tagline: 'Street-level heat risk maps that tell a city where to act first.',
    themes: ['climate', 'ai-ml'],
    techStack: ['Python', 'Google Earth Engine', 'GeoPandas', 'scikit-learn', 'React', 'Leaflet'],
    team: ['Ishita Reddy', 'Farhan Ali', 'Keerthi Rao'],
    sections: {
      problem:
        'Hyderabad now has summer days above 44°C. City-wide temperatures hide a 6–8°C gap between a tree-lined colony and a dense neighbourhood with tin roofs, and that gap decides who ends up in hospital.\n\nWard officers planning heat action needed to know which streets were hottest and who lived there.',
      built:
        'We took land surface temperature from Landsat thermal images for the last five summers and combined it with tree cover and building density to rank every ward by heat risk.\n\nClick a ward and the map tells you where shade, drinking water points and cool roofs would help the most people first, with a simple forecast for the coming week.',
      won:
        'The week before, we rode around on scooters with a ₹900 thermometer and took readings at 12 spots. On stage we showed how our map compared with those readings, errors included. The judges said that honesty made the rest believable.\n\nThe second thing they liked: every chart ended in an action, not just a pretty map.',
      lessons:
        'A small field check makes a data project far more convincing. You don’t need fancy equipment.\n\nShow your error and your limits on a slide. Judges trust you more, not less.\n\nVenue Wi-Fi is slow. If the rules allow it, download big datasets before you arrive.',
    },
    links: { demo: 'https://example.com', github: 'https://github.com' },
    daysAgo: 86,
    cheers: 264,
  },
  {
    id: 'leaksense-smart-water-challenge-2025',
    authorHandle: 'rohan-deshmukh',
    hackathon: 'Smart Water Challenge 2025',
    city: 'pune',
    result: 'winner',
    prize: '₹75,000 + a pilot in two Pune housing societies',
    projectName: 'LeakSense',
    tagline: 'Find water leaks in your society before the tanker bill does.',
    themes: ['iot', 'climate'],
    techStack: ['ESP32', 'Flow sensors', 'MQTT', 'Node-RED', 'InfluxDB', 'Grafana'],
    team: ['Rohan Deshmukh', 'Aditi Joshi', 'Sameer Kale'],
    sections: {
      problem:
        'Many Pune housing societies buy tankers every summer. Overhead tanks overflow at 3 am, pipes leak inside walls, and the secretary only finds out when the tanker count doubles.',
      built:
        'Clip-on flow sensors on the main inlet and on each wing’s line, read by an ESP32 every 10 seconds and sent over MQTT. LeakSense learns normal use for each hour of the week and sends a WhatsApp alert when night-time flow stays above normal for 20 minutes, or when a tank overflows.\n\nThe secretary gets a simple dashboard: litres per wing per day, and where the waste is.',
      won:
        'We brought a working rig on stage: a bucket, a small pump and a pipe with a “leak” valve. We opened the valve and the alert reached the judge’s phone in under a minute.\n\nWe also showed the parts cost, ₹1,850 per wing. Judges at hardware hackathons always ask what it costs, and we had the sheet ready.',
      lessons:
        'Carry spares. We burnt an ESP32 at 2 am and only survived because we had two more.\n\nRecord a backup video of the demo working, in case the venue power or Wi-Fi fails.\n\nThe alert is the product. Don’t spend the night on dashboard charts nobody will look at.',
    },
    links: { github: 'https://github.com' },
    daysAgo: 112,
    cheers: 227,
  },
  {
    id: 'bhashabridge-mumbai-ai-hack-2025',
    authorHandle: 'zoya-khan',
    hackathon: 'Mumbai AI Hack 2025',
    city: 'mumbai',
    result: 'winner',
    prize: '₹1,00,000 + GPU credits',
    projectName: 'BhashaBridge',
    tagline: 'Speak in your own language, get the form filled in English.',
    themes: ['ai-ml', 'social-impact'],
    techStack: ['Whisper', 'IndicTrans2', 'Python', 'FastAPI', 'WhatsApp Cloud API', 'React'],
    team: ['Zoya Khan', 'Aditya Pawar', 'Mariam Shaikh', 'Neel Gupta'],
    sections: {
      problem:
        'Migrant workers and older people in Mumbai have to fill ration card, scholarship and hospital forms in English or formal Marathi. Most of them speak a mix of Hindi, Urdu and Marathi, and end up paying an agent or waiting in a helpdesk queue.',
      built:
        'Send BhashaBridge a WhatsApp voice note in your own words. It transcribes the speech, picks out the details the form needs (name, address, Aadhaar-linked mobile, income) and returns a filled form.\n\nBefore anything is final, it reads the details back to you in your language so you can correct mistakes.',
      won:
        'We asked a judge to send his own voice note in Hindi with English words mixed in, and it filled the form correctly. That moment won it.\n\nWe had also measured our accuracy on 200 clips recorded (with consent) from our families: errors fell from 18% to 11% after we fine-tuned a small speech model on code-mixed speech.',
      lessons:
        'Real Indian speech is code-mixed. Test with how people actually talk, not clean datasets.\n\nAlways ask for consent when you record people, and say so in your pitch.\n\nA small fine-tuned model that answers in two seconds beats a big one that takes ten. Speed matters in a live demo.',
    },
    links: { demo: 'https://example.com', github: 'https://github.com' },
    daysAgo: 115,
    cheers: 296,
  },
  {
    id: 'craftconnect-rajasthan-ideathon-2025',
    authorHandle: 'vikram-singh',
    hackathon: 'Rajasthan Ideathon 2025',
    city: 'jaipur',
    result: 'winner',
    prize: '₹40,000 + a spot in a state incubator programme',
    projectName: 'CraftConnect',
    tagline: 'Fair online orders for block-print artisans, without the middlemen.',
    themes: ['social-impact', 'fintech'],
    techStack: ['Figma', 'WhatsApp Business', 'UPI payment links', 'Google Sheets', 'Canva'],
    team: ['Vikram Singh', 'Nikita Rathore', 'Imran Qureshi'],
    sections: {
      problem:
        'Block-print artisans in Bagru and Sanganer earn 15–20% of what a buyer finally pays. Traders sit in between, and payments often come weeks later.\n\nThe artisans already use WhatsApp, but orders from Instagram buyers get lost in chats and there is no way to take an advance.',
      built:
        'It was an ideathon, so we built a plan and a clickable prototype. A cluster coordinator runs one shared WhatsApp catalogue for six artisan families, buyers pay an advance through a UPI link, and a simple order tracker shows every family what’s due.\n\nThe weekend before, we spent two days in Bagru interviewing nine artisans.',
      won:
        'Ideathons are judged on clarity: the problem, who pays, and how it grows. We played short audio clips from the artisans (with their permission) and put our unit economics on one slide: the artisan’s share goes from 20% to 55%.\n\nWhen a judge asked why a big marketplace wouldn’t do this, we had an answer ready: language, trust, and a local coordinator people already know.',
      lessons:
        'Talk to real users before the event. In an ideathon, your research is your build.\n\nOne number per slide. If you need a table, it belongs in the appendix.\n\nPick one teammate to keep time during the pitch and Q&A, and practise with a friend who plays the sceptic.',
    },
    links: { demo: 'https://example.com' },
    daysAgo: 140,
    cheers: 173,
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

export function winById(id: string): WinStory | undefined {
  return WINS.find((w) => w.id === id);
}

export function winsByAuthor(handle: string): WinStory[] {
  return WINS.filter((w) => w.authorHandle === handle);
}

/** Newest first. */
export function latestWins(limit = 3): WinStory[] {
  return [...WINS].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, limit);
}

export function isMyWin(story: WinStory): story is MyWinStory {
  return 'postedAt' in story;
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
  if (isMyWin(story)) return { ...story.author, href: '/profile' };
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
