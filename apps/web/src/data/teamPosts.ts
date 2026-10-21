export interface TeamPost {
  id: string;
  name: string;
  /** e.g. "3rd year, Computer Engineering" */
  about: string;
  city: string;
  hackathonSlug: string;
  has: string[];
  needs: string[];
  idea: string;
  postedDaysAgo: number;
}

export const SKILLS = [
  'Frontend',
  'Backend',
  'Full stack',
  'Mobile',
  'ML / AI',
  'Data',
  'UI/UX design',
  'Hardware / IoT',
  'Blockchain',
  'Pitching',
  'Product',
  'Game dev',
];

// Sample posts shown in the preview; real posts come from signed-in students.
export const sampleTeamPosts: TeamPost[] = [
  {
    id: 's1',
    name: 'Aarav',
    about: '3rd year, Computer Engineering',
    city: 'Pune',
    hackathonSlug: 'codestorm-2026',
    has: ['Backend', 'ML / AI'],
    needs: ['Frontend', 'UI/UX design'],
    idea: 'An AI study buddy that turns lecture notes into quizzes. I have the model working, need someone to make it look good.',
    postedDaysAgo: 0,
  },
  {
    id: 's2',
    name: 'Sneha',
    about: '2nd year, IT',
    city: 'Pune',
    hackathonSlug: 'hackher-pune',
    has: ['UI/UX design', 'Pitching'],
    needs: ['Full stack', 'Mobile'],
    idea: 'A women’s safety app for late-night commutes with shared live routes. Looking for two builders.',
    postedDaysAgo: 1,
  },
  {
    id: 's3',
    name: 'Rohan',
    about: 'Final year, Electronics',
    city: 'Pune',
    hackathonSlug: 'smart-city-hack-pune',
    has: ['Hardware / IoT'],
    needs: ['Backend', 'Data', 'Pitching'],
    idea: 'Smart water meters for housing societies that flag leaks early. Have the sensor prototype, need the dashboard and pitch.',
    postedDaysAgo: 2,
  },
  {
    id: 's4',
    name: 'Priya',
    about: '1st year, Computer Science',
    city: 'Online',
    hackathonSlug: 'buildfest-online',
    has: ['Frontend'],
    needs: ['Backend'],
    idea: 'First hackathon! Want to build a simple expense splitter for hostel friends. Beginners welcome.',
    postedDaysAgo: 2,
  },
  {
    id: 's5',
    name: 'Kabir',
    about: 'Working, 1 year experience',
    city: 'Bengaluru',
    hackathonSlug: 'web3-builders-weekend',
    has: ['Blockchain', 'Backend'],
    needs: ['Frontend', 'Product'],
    idea: 'Transparent donation tracking for small NGOs on-chain. Need a frontend dev and someone who can talk to users.',
    postedDaysAgo: 3,
  },
  {
    id: 's6',
    name: 'Ishita',
    about: '3rd year, AI & Data Science',
    city: 'Online',
    hackathonSlug: 'greencode-climate-hack',
    has: ['ML / AI', 'Data'],
    needs: ['Full stack', 'UI/UX design'],
    idea: 'Predict heat-wave hotspots in Indian cities from open satellite data, and show them on a simple map.',
    postedDaysAgo: 4,
  },
];
