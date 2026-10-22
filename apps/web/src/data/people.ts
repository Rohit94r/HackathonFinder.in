// Sample students shown in the preview (profiles, Team Finder, discussions and winning
// stories all link to them). They are made up; real profiles come with student accounts.

export type ResultKind = 'winner' | 'runner-up' | 'finalist' | 'participant';

export const RESULT_LABELS: Record<ResultKind, string> = {
  winner: 'Winner',
  'runner-up': 'Runner-up',
  finalist: 'Finalist',
  participant: 'Participant',
};

export interface HackathonRecord {
  event: string;
  /** Set when the event is one of our listings. */
  hackathonSlug?: string;
  result: ResultKind;
  project: string;
  /** How long ago it happened, so the sample stays current. */
  monthsAgo: number;
}

export interface Person {
  /** URL name, used at /u/[handle]. */
  handle: string;
  name: string;
  /** e.g. "3rd year, Computer Engineering" or "Working, 2 years" */
  about: string;
  college: string;
  /** City slug from CITIES. */
  city: string;
  skills: string[];
  bio: string;
  github?: string;
  linkedin?: string;
  /** Months since they joined HackathonFinder. */
  joinedMonthsAgo: number;
  lookingForTeam: boolean;
  record: HackathonRecord[];
}

export const PEOPLE: Person[] = [
  {
    handle: 'aarav-patil',
    name: 'Aarav Patil',
    about: '3rd year, Computer Engineering',
    college: 'Deccan Institute of Technology, Pune',
    city: 'pune',
    skills: ['Backend', 'ML / AI'],
    bio: 'I build backends and small ML models. Looking for designers who care about details.',
    github: 'https://github.com',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 14,
    lookingForTeam: true,
    record: [
      { event: 'Monsoon Hack 2026', hackathonSlug: 'monsoon-hack-2026', result: 'finalist', project: 'FloodWatch', monthsAgo: 2 },
      { event: 'Deccan Hack 2025', result: 'winner', project: 'NoteQuiz AI', monthsAgo: 6 },
      { event: 'Pune Open Build Night', result: 'participant', project: 'BusBuddy', monthsAgo: 10 },
    ],
  },
  {
    handle: 'sneha-kulkarni',
    name: 'Sneha Kulkarni',
    about: '2nd year, Information Technology',
    college: 'Sahyadri College of Engineering, Pune',
    city: 'pune',
    skills: ['UI/UX design', 'Pitching', 'Frontend'],
    bio: 'Designer who pitches. I like apps that make cities safer for women.',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 8,
    lookingForTeam: true,
    record: [
      { event: 'Design Sprint Pune', result: 'runner-up', project: 'SafeRoute', monthsAgo: 3 },
      { event: 'Ideathon West 2025', result: 'participant', project: 'Canteen Queue', monthsAgo: 7 },
    ],
  },
  {
    handle: 'rohan-deshmukh',
    name: 'Rohan Deshmukh',
    about: 'Final year, Electronics',
    college: 'Western Institute of Engineering, Pune',
    city: 'pune',
    skills: ['Hardware / IoT', 'Data'],
    bio: 'Sensors, ESP32s and dashboards. Two hardware wins, always hunting for the next build.',
    github: 'https://github.com',
    joinedMonthsAgo: 20,
    lookingForTeam: false,
    record: [
      { event: 'Smart Water Challenge 2025', result: 'winner', project: 'LeakSense', monthsAgo: 4 },
      { event: 'IoT Weekend 2025', result: 'winner', project: 'ColdChain Tag', monthsAgo: 9 },
      { event: 'Hardware Hack Mumbai', result: 'finalist', project: 'GreenMeter', monthsAgo: 13 },
      { event: 'Campus Robotics Jam', result: 'participant', project: 'LineBot', monthsAgo: 18 },
    ],
  },
  {
    handle: 'priya-wankhede',
    name: 'Priya Wankhede',
    about: '1st year, Computer Science',
    college: 'Vidarbha College of Technology, Nagpur',
    city: 'nagpur',
    skills: ['Frontend'],
    bio: 'First-year, learning React. Looking for my first hackathon team!',
    joinedMonthsAgo: 1,
    lookingForTeam: true,
    record: [],
  },
  {
    handle: 'kabir-rao',
    name: 'Kabir Rao',
    about: 'Working, 1 year experience',
    college: 'Garden City University, Bengaluru',
    city: 'bengaluru',
    skills: ['Blockchain', 'Backend'],
    bio: 'Backend engineer by day, web3 builder on weekends.',
    github: 'https://github.com',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 16,
    lookingForTeam: true,
    record: [
      { event: 'Chain Builders Bengaluru', result: 'runner-up', project: 'GiveTrack', monthsAgo: 5 },
      { event: 'DeFi Weekend 2025', result: 'participant', project: 'SplitPay', monthsAgo: 11 },
    ],
  },
  {
    handle: 'ishita-reddy',
    name: 'Ishita Reddy',
    about: '3rd year, AI & Data Science',
    college: 'Deccan Plateau Institute of Technology, Hyderabad',
    city: 'hyderabad',
    skills: ['ML / AI', 'Data'],
    bio: 'Satellite data, heat maps and climate models. Happy to mentor first-timers.',
    github: 'https://github.com',
    joinedMonthsAgo: 12,
    lookingForTeam: true,
    record: [
      { event: 'Climate Data Hack 2025', result: 'winner', project: 'HeatMap India', monthsAgo: 3 },
      { event: 'HealthAI Hyderabad', result: 'finalist', project: 'XrayAssist', monthsAgo: 8 },
    ],
  },
  {
    handle: 'ananya-sharma',
    name: 'Ananya Sharma',
    about: 'Final year, Computer Science',
    college: 'Yamuna Institute of Technology, Delhi NCR',
    city: 'delhi-ncr',
    skills: ['Full stack', 'Product', 'Pitching'],
    bio: '12 hackathons, 4 wins. I write about what judges actually look for.',
    github: 'https://github.com',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 24,
    lookingForTeam: false,
    record: [
      { event: 'Capital Hack 2026', result: 'winner', project: 'RentRight', monthsAgo: 1 },
      { event: 'GovTech Challenge 2025', result: 'winner', project: 'GrievanceBot', monthsAgo: 5 },
      { event: 'Noida Startup Hack', result: 'runner-up', project: 'ShiftSwap', monthsAgo: 8 },
      { event: 'EdTech Sprint 2025', result: 'winner', project: 'ClassPulse', monthsAgo: 12 },
      { event: 'FinTech Fest Delhi', result: 'winner', project: 'KhataBook Lite', monthsAgo: 16 },
      { event: 'Women Who Code Hack', result: 'finalist', project: 'MentorMatch', monthsAgo: 20 },
    ],
  },
  {
    handle: 'arjun-iyer',
    name: 'Arjun Iyer',
    about: '3rd year, Electronics & Communication',
    college: 'Coromandel Institute of Engineering, Chennai',
    city: 'chennai',
    skills: ['Hardware / IoT', 'Backend'],
    bio: 'Embedded systems and late-night soldering.',
    github: 'https://github.com',
    joinedMonthsAgo: 9,
    lookingForTeam: true,
    record: [{ event: 'Midnight Hack Chennai', hackathonSlug: 'midnight-hack-chennai', result: 'participant', project: 'NightBus Tracker', monthsAgo: 0 }],
  },
  {
    handle: 'meera-nair',
    name: 'Meera Nair',
    about: '2nd year, Civil Engineering',
    college: 'Malabar College of Engineering, Kochi',
    city: 'kochi',
    skills: ['Data', 'Product'],
    bio: 'Civil engineer who codes. Water, coasts and flood data.',
    joinedMonthsAgo: 5,
    lookingForTeam: true,
    record: [{ event: 'Kerala Flood Data Jam', result: 'finalist', project: 'TideAlert', monthsAgo: 4 }],
  },
  {
    handle: 'dev-shah',
    name: 'Dev Shah',
    about: '3rd year, Information Technology',
    college: 'Sabarmati Institute of Technology, Ahmedabad',
    city: 'ahmedabad',
    skills: ['Mobile', 'Backend'],
    bio: 'Flutter and Firebase. Building money tools for small shops.',
    github: 'https://github.com',
    joinedMonthsAgo: 7,
    lookingForTeam: true,
    record: [
      { event: 'Gujarat Fintech Day', result: 'runner-up', project: 'DukaanPay', monthsAgo: 2 },
      { event: 'Mobile Dev Jam 2025', result: 'participant', project: 'ChaiCount', monthsAgo: 6 },
    ],
  },
  {
    handle: 'riya-sen',
    name: 'Riya Sen',
    about: '2nd year, Computer Science',
    college: 'Hooghly Institute of Technology, Kolkata',
    city: 'kolkata',
    skills: ['Frontend', 'UI/UX design'],
    bio: 'Pixel-pusher and Tailwind fan. I make demos look finished.',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 4,
    lookingForTeam: true,
    record: [{ event: 'Bengal Build Weekend', result: 'participant', project: 'BookSwap', monthsAgo: 3 }],
  },
  {
    handle: 'vikram-singh',
    name: 'Vikram Singh',
    about: 'Final year, Mechanical Engineering',
    college: 'Aravalli Institute of Technology, Jaipur',
    city: 'jaipur',
    skills: ['Product', 'Pitching'],
    bio: 'I pitch, plan and keep the team on time. Ideathons are my thing.',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 11,
    lookingForTeam: true,
    record: [
      { event: 'Rajasthan Ideathon 2025', result: 'winner', project: 'CraftConnect', monthsAgo: 5 },
      { event: 'Startup Weekend Jaipur', result: 'finalist', project: 'Haveli Stays', monthsAgo: 10 },
    ],
  },
  {
    handle: 'zoya-khan',
    name: 'Zoya Khan',
    about: '3rd year, Computer Engineering',
    college: 'Arabian Sea Institute of Technology, Mumbai',
    city: 'mumbai',
    skills: ['ML / AI', 'Full stack'],
    bio: 'NLP for Indian languages. Hindi and Urdu speech models are my side quest.',
    github: 'https://github.com',
    joinedMonthsAgo: 10,
    lookingForTeam: false,
    record: [
      { event: 'Mumbai AI Hack 2025', result: 'winner', project: 'BhashaBridge', monthsAgo: 4 },
      { event: 'HackHer 2025', result: 'runner-up', project: 'CareCircle', monthsAgo: 9 },
    ],
  },
  {
    handle: 'harsh-jain',
    name: 'Harsh Jain',
    about: '2nd year, Computer Science',
    college: 'Malwa Institute of Technology, Indore',
    city: 'indore',
    skills: ['Backend', 'Data'],
    bio: 'Node, Postgres and too much chai.',
    github: 'https://github.com',
    joinedMonthsAgo: 3,
    lookingForTeam: true,
    record: [],
  },
];

export function personByHandle(handle: string): Person | undefined {
  return PEOPLE.find((p) => p.handle === handle);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Reds, oranges and charcoal from the landing palette, all dark enough for white initials.
const AVATAR_COLORS = ['bg-brand-600', 'bg-brand-800', 'bg-pop-dark', 'bg-[#d4502a]', 'bg-[#3d3a44]', 'bg-brand-700', 'bg-[#7a3b1d]'];

/** A stable avatar colour per name (full class strings so Tailwind keeps them). */
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function countResults(record: HackathonRecord[]) {
  return {
    hackathons: record.length,
    wins: record.filter((r) => r.result === 'winner').length,
    podiums: record.filter((r) => r.result === 'winner' || r.result === 'runner-up').length,
    finals: record.filter((r) => r.result !== 'participant').length,
  };
}
