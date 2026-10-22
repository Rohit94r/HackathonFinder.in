import { THEMES } from '@hackathonfinder/shared';

// Sample community discussions for the preview. Authors are the sample students in
// people.ts; times are relative so the board always looks current.

export type CategoryId = 'general' | 'hackathon-qa' | 'team-up' | 'feedback' | 'resources' | 'city-talk';

export interface DiscussionCategory {
  id: CategoryId;
  label: string;
  description: string;
}

export const CATEGORIES: DiscussionCategory[] = [
  { id: 'general', label: 'General', description: 'Anything about hackathons, building and college tech life.' },
  { id: 'hackathon-qa', label: 'Hackathon Q&A', description: 'Ask about a specific event: rules, level, travel and prizes.' },
  { id: 'team-up', label: 'Team up', description: 'Find teammates, or a team that needs your skills.' },
  { id: 'feedback', label: 'Project feedback', description: 'Share what you built and get honest feedback.' },
  { id: 'resources', label: 'Resources', description: 'Free APIs, credits, templates and ways to find events.' },
  { id: 'city-talk', label: 'City talk', description: 'Meetups, travel and hackathons in your city.' },
];

export interface Reply {
  id: string;
  /** A handle from PEOPLE. */
  authorHandle: string;
  body: string;
  hoursAgo: number;
  votes: number;
}

export interface Thread {
  id: string;
  title: string;
  /** Plain text; paragraphs are separated by a blank line. */
  body: string;
  category: CategoryId;
  /** Theme slugs from THEMES and/or free tags. */
  tags: string[];
  /** A handle from PEOPLE. */
  authorHandle: string;
  /** City slug from CITIES. */
  city?: string;
  /** Slug of the listing this is about. */
  hackathonSlug?: string;
  hoursAgo: number;
  votes: number;
  pinned?: boolean;
  replies: Reply[];
}

const text = (...paragraphs: string[]) => paragraphs.join('\n\n');

export const THREADS: Thread[] = [
  {
    id: 'welcome-and-community-rules',
    title: 'Welcome to HackathonFinder Discussions + community rules',
    body: text(
      'Hi everyone! This is the place to talk with students from across India: ask about a hackathon, find teammates, share what you built and help first-timers.',
      'A few simple rules:\n1. Be kind. Everyone was a first-timer once. No ragging, no gatekeeping.\n2. Stay on topic: hackathons, building, learning and college tech life.\n3. No spam or paid promotions. Organizers can list events for free at /submit.\n4. Don’t post phone numbers or personal details. Use Team Finder or your city WhatsApp group to connect.\n5. Give credit. If you share someone’s project or post, link to it.\n6. See something off? Email hello@hackathonfinder.in.',
      'Start by saying hi below: your city, your year and what you want to build this semester.'
    ),
    category: 'general',
    tags: ['start-here', 'rules'],
    authorHandle: 'ananya-sharma',
    hoursAgo: 960,
    votes: 214,
    pinned: true,
    replies: [
      {
        id: 'welcome-and-community-rules-r1',
        authorHandle: 'aarav-patil',
        body: 'Hi from Pune! 3rd year Comp. I build small ML tools and I’m hunting for a designer for CodeStorm.',
        hoursAgo: 900,
        votes: 18,
      },
      {
        id: 'welcome-and-community-rules-r2',
        authorHandle: 'priya-wankhede',
        body: 'Hello from Nagpur! 1st year CS, learning React. Hoping to do my first hackathon this month.',
        hoursAgo: 700,
        votes: 24,
      },
      {
        id: 'welcome-and-community-rules-r3',
        authorHandle: 'riya-sen',
        body: 'Kolkata here. Frontend and UI. Happy to look at anyone’s landing page before demo day.',
        hoursAgo: 600,
        votes: 15,
      },
      {
        id: 'welcome-and-community-rules-r4',
        authorHandle: 'meera-nair',
        body: 'Kochi! Civil engineering student who codes. Looking for people who care about flood and coast data.',
        hoursAgo: 300,
        votes: 9,
      },
    ],
  },
  {
    id: 'first-offline-hackathon-pune-what-to-carry',
    title: 'First offline hackathon in Pune: what should I carry?',
    body: text(
      'Coming from Nagpur for GameJam Pune. It’s 48 hours at the venue in Baner and I’ve never done an offline hackathon before.',
      'What should I pack? Laptop and charger obviously, but do I need an extension board, a blanket, my own food? And is it okay to sleep at the venue or should I book a PG nearby?'
    ),
    category: 'hackathon-qa',
    tags: ['gaming', 'beginners', 'offline'],
    authorHandle: 'priya-wankhede',
    city: 'pune',
    hackathonSlug: 'gamejam-pune',
    hoursAgo: 5,
    votes: 42,
    replies: [
      {
        id: 'first-offline-hackathon-pune-what-to-carry-r1',
        authorHandle: 'sneha-kulkarni',
        body: text(
          'My pack list from two offline events:\n- Laptop, charger and a 4-socket extension board (sockets run out first)\n- Phone charger and a power bank\n- A hoodie or shawl: the AC at 3 AM is brutal\n- Toothbrush, deo, a small towel and one change of clothes\n- Earphones, a water bottle and your college ID',
          'Food is usually covered. Carry some biscuits and chikki anyway.'
        ),
        hoursAgo: 4,
        votes: 31,
      },
      {
        id: 'first-offline-hackathon-pune-what-to-carry-r2',
        authorHandle: 'rohan-deshmukh',
        body: 'Sleeping at the venue is normal. Bring a thin mat or a yoga mat if you have one, the floor gets cold. Most teams nap in shifts.',
        hoursAgo: 4,
        votes: 12,
      },
      {
        id: 'first-offline-hackathon-pune-what-to-carry-r3',
        authorHandle: 'aarav-patil',
        body: 'Also: install everything before you leave home. Venue wifi with 200 people on it is slow, so don’t plan to download Unity or Godot there.',
        hoursAgo: 3,
        votes: 19,
      },
      {
        id: 'first-offline-hackathon-pune-what-to-carry-r4',
        authorHandle: 'priya-wankhede',
        body: 'This is so helpful, thank you! Adding the extension board and the mat to my list.',
        hoursAgo: 2,
        votes: 3,
      },
    ],
  },
  {
    id: 'is-codestorm-beginner-friendly',
    title: 'Is CodeStorm beginner friendly?',
    body: text(
      'The listing says beginner-friendly and there’s a ₹20,000 prize for the best first-time team. But it’s also 36 hours and AI themed.',
      'I know Node and Postgres but have never trained a model. Will we get destroyed by final years who do this every month? Is it worth travelling from Indore?'
    ),
    category: 'hackathon-qa',
    tags: ['ai-ml', 'beginners'],
    authorHandle: 'harsh-jain',
    city: 'pune',
    hackathonSlug: 'codestorm-2026',
    hoursAgo: 9,
    votes: 36,
    replies: [
      {
        id: 'is-codestorm-beginner-friendly-r1',
        authorHandle: 'aarav-patil',
        body: 'I went last year. Honestly, most winning projects used an AI API plus a solid backend. Nobody trained a model from scratch in 36 hours. Your Node skills are exactly what teams need.',
        hoursAgo: 8,
        votes: 27,
      },
      {
        id: 'is-codestorm-beginner-friendly-r2',
        authorHandle: 'ananya-sharma',
        body: 'Judges care about a working demo and a clear problem. A simple app that works beats a fancy model that crashes. And the first-timer prize means you’re not up against everyone for that one.',
        hoursAgo: 7,
        votes: 22,
      },
      {
        id: 'is-codestorm-beginner-friendly-r3',
        authorHandle: 'zoya-khan',
        body: 'Quick prep idea: build one tiny thing with an LLM API and one with a Hugging Face model before the event. That’s enough to talk confidently with the mentors.',
        hoursAgo: 6,
        votes: 14,
      },
      {
        id: 'is-codestorm-beginner-friendly-r4',
        authorHandle: 'harsh-jain',
        body: 'Okay, convinced. Registering today. Anyone from Indore going? We can share the bus.',
        hoursAgo: 2,
        votes: 6,
      },
    ],
  },
  {
    id: 'need-ml-person-smart-city-hack-pune',
    title: 'Need an ML person for Smart City Hack Pune',
    body: text(
      'We’re a team of three: me (hardware and sensors), one backend dev and one designer. The idea: cheap sensors on housing society water tanks that warn about overflow and leaks before they happen.',
      'We need someone who can do time-series forecasting, or at least anomaly detection, on sensor data. The limit is six per team, so there’s room for one or two more.',
      'It’s offline in Shivajinagar, college teams only. Reply here or send me a request on Team Finder.'
    ),
    category: 'team-up',
    tags: ['smart-cities', 'iot', 'ai-ml'],
    authorHandle: 'rohan-deshmukh',
    city: 'pune',
    hackathonSlug: 'smart-city-hack-pune',
    hoursAgo: 14,
    votes: 28,
    replies: [
      {
        id: 'need-ml-person-smart-city-hack-pune-r1',
        authorHandle: 'aarav-patil',
        body: 'Interested! I did a flood alert model for Monsoon Hack: an LSTM plus some simple thresholds. Which college are you from? Not sure if mixed-college teams are allowed.',
        hoursAgo: 12,
        votes: 9,
      },
      {
        id: 'need-ml-person-smart-city-hack-pune-r2',
        authorHandle: 'rohan-deshmukh',
        body: 'Mixed colleges are fine as long as everyone is a student, I asked the organizers. Sending you a request on Team Finder.',
        hoursAgo: 11,
        votes: 5,
      },
      {
        id: 'need-ml-person-smart-city-hack-pune-r3',
        authorHandle: 'ishita-reddy',
        body: 'Tip from my climate hack: don’t over-engineer the model. A rolling average with alerts and a clean dashboard won us more points than the fancy model did.',
        hoursAgo: 8,
        votes: 11,
      },
    ],
  },
  {
    id: 'how-do-judges-score-ideathons',
    title: 'How do judges score ideathons?',
    body: text(
      'I’ve done a few hackathons, but AI for Bharat is an ideathon, so no code. We only submit a deck and a 3-minute video.',
      'What do judges actually look for when there’s nothing to demo? The idea, the research, the business model? How much does the deck design matter?'
    ),
    category: 'hackathon-qa',
    tags: ['social-impact', 'ideathon', 'pitching'],
    authorHandle: 'ishita-reddy',
    city: 'hyderabad',
    hackathonSlug: 'ai-for-bharat-ideathon',
    hoursAgo: 26,
    votes: 51,
    replies: [
      {
        id: 'how-do-judges-score-ideathons-r1',
        authorHandle: 'vikram-singh',
        body: text(
          'I won the Rajasthan Ideathon last year. Most rubrics look something like this:\n- Problem: is it real and specific? (25%)\n- Solution: does it actually solve it? (25%)\n- Feasibility: could it be built and used in India today? (20%)\n- Impact and scale (20%)\n- Presentation (10%)',
          'Talk to 5 to 10 real users before you submit and put their quotes in the deck. Judges love that.'
        ),
        hoursAgo: 24,
        votes: 38,
      },
      {
        id: 'how-do-judges-score-ideathons-r2',
        authorHandle: 'ananya-sharma',
        body: '+1 to Vikram. Also name your user: “a kirana owner in Indore”, not “small businesses”. And show one clear flow of how they’d use it. A Figma mockup counts as a demo in ideathons.',
        hoursAgo: 22,
        votes: 24,
      },
      {
        id: 'how-do-judges-score-ideathons-r3',
        authorHandle: 'sneha-kulkarni',
        body: 'Deck design matters less than you’d think, but clarity matters a lot. One idea per slide, big text. Judges go through a hundred decks.',
        hoursAgo: 20,
        votes: 13,
      },
      {
        id: 'how-do-judges-score-ideathons-r4',
        authorHandle: 'ishita-reddy',
        body: 'This is gold, thank you. Doing user calls this weekend.',
        hoursAgo: 18,
        votes: 4,
      },
    ],
  },
  {
    id: 'roast-my-hackathon-project-nightbus-tracker',
    title: 'Roast my hackathon project: NightBus Tracker',
    body: text(
      'Built this at Midnight Hack Chennai. It shows where night buses are using GPS from riders’ phones (crowdsourced, no official data). We didn’t place.',
      'Stack: React, Firebase and Leaflet maps. The demo had four fake riders on a loop.',
      'The judges said “interesting” and moved on. Please roast it honestly so I can fix it before my next hackathon.'
    ),
    category: 'feedback',
    tags: ['smart-cities', 'web-dev', 'pitching'],
    authorHandle: 'arjun-iyer',
    city: 'chennai',
    hoursAgo: 40,
    votes: 33,
    replies: [
      {
        id: 'roast-my-hackathon-project-nightbus-tracker-r1',
        authorHandle: 'riya-sen',
        body: 'Roast, with love: “crowdsourced” with four fake riders is the problem. The judges couldn’t picture it working on day one. Who shares GPS first, and why would they? Answer that in the first 30 seconds.',
        hoursAgo: 38,
        votes: 21,
      },
      {
        id: 'roast-my-hackathon-project-nightbus-tracker-r2',
        authorHandle: 'kabir-rao',
        body: 'Also battery. Someone will always ask if it drains the phone. Have a number ready, like “updates every 30 seconds, about 3% battery an hour”.',
        hoursAgo: 36,
        votes: 14,
      },
      {
        id: 'roast-my-hackathon-project-nightbus-tracker-r3',
        authorHandle: 'ananya-sharma',
        body: 'The idea is good. Open with a story: a student at a bus stop at 11 PM with no idea when the bus is coming. Then show the map. Story first, stack last.',
        hoursAgo: 30,
        votes: 17,
      },
      {
        id: 'roast-my-hackathon-project-nightbus-tracker-r4',
        authorHandle: 'arjun-iyer',
        body: 'Brutal but fair. Adding a “conductor mode” so the bus crew can share location too. That fixes the first-rider problem.',
        hoursAgo: 20,
        votes: 8,
      },
    ],
  },
  {
    id: 'best-free-apis-and-credits-for-hackathons',
    title: 'Best free APIs and credits for hackathons',
    body: text(
      'Let’s make one list so nobody has to pay for anything during a hackathon. What I use:',
      '- Hosting: Vercel or Netlify free tiers for frontends, Render for small backends\n- Database and auth: Supabase or Firebase free tiers\n- AI: the Gemini API free tier, Groq for fast open models, Hugging Face for small models\n- Maps: OpenStreetMap with Leaflet\n- Credits: the GitHub Student Developer Pack (domains, cloud credits and tools)',
      'Add yours below. Please say if it needs a credit card, a lot of us don’t have one.'
    ),
    category: 'resources',
    tags: ['ai-ml', 'web-dev', 'free-credits'],
    authorHandle: 'kabir-rao',
    city: 'bengaluru',
    hoursAgo: 60,
    votes: 88,
    replies: [
      {
        id: 'best-free-apis-and-credits-for-hackathons-r1',
        authorHandle: 'zoya-khan',
        body: 'For Indian languages, AI4Bharat has open models for Hindi, Tamil, Bengali and more. Great for anything “Bharat” themed.',
        hoursAgo: 55,
        votes: 29,
      },
      {
        id: 'best-free-apis-and-credits-for-hackathons-r2',
        authorHandle: 'arjun-iyer',
        body: 'For hardware: Wokwi simulates ESP32 and Arduino in the browser. Saved us when a sensor died at 2 AM.',
        hoursAgo: 50,
        votes: 18,
      },
      {
        id: 'best-free-apis-and-credits-for-hackathons-r3',
        authorHandle: 'dev-shah',
        body: 'Payment gateways like Razorpay and Cashfree have test modes, so you can demo real-looking UPI payments without any money moving. Perfect for fintech events.',
        hoursAgo: 44,
        votes: 16,
      },
      {
        id: 'best-free-apis-and-credits-for-hackathons-r4',
        authorHandle: 'priya-wankhede',
        body: 'Saving this thread. Does the GitHub Student Pack work if my college is small and not very well known?',
        hoursAgo: 30,
        votes: 5,
      },
      {
        id: 'best-free-apis-and-credits-for-hackathons-r5',
        authorHandle: 'kabir-rao',
        body: 'Yes, you can apply with your college email or a photo of your college ID. Approval can take a few days, so apply now, not the night before.',
        hoursAgo: 28,
        votes: 12,
      },
    ],
  },
  {
    id: 'kolkata-folks-anyone-going-to-code-carnival',
    title: 'Kolkata folks, anyone going to Code Carnival?',
    body: text(
      'Code Carnival is hybrid this year: Salt Lake Sector V or online. I’m planning to go in person.',
      'Anyone else from Kolkata colleges? It’d be nice to meet before the event, maybe a chai meetup near College Street, and form teams there. I do frontend and UI and I’m looking for a backend dev.'
    ),
    category: 'city-talk',
    tags: ['open-innovation', 'meetup'],
    authorHandle: 'riya-sen',
    city: 'kolkata',
    hackathonSlug: 'kolkata-code-carnival',
    hoursAgo: 18,
    votes: 24,
    replies: [
      {
        id: 'kolkata-folks-anyone-going-to-code-carnival-r1',
        authorHandle: 'kabir-rao',
        body: 'Joining online from Bengaluru. If you’re okay with a remote teammate, I’m in for backend: Node and Postgres.',
        hoursAgo: 16,
        votes: 7,
      },
      {
        id: 'kolkata-folks-anyone-going-to-code-carnival-r2',
        authorHandle: 'ananya-sharma',
        body: 'The day-one workshops are worth going in person for. Last year they had a really good one on pitching.',
        hoursAgo: 14,
        votes: 5,
      },
      {
        id: 'kolkata-folks-anyone-going-to-code-carnival-r3',
        authorHandle: 'riya-sen',
        body: 'Kabir, sending you a team request! Still doing the chai meetup on Saturday for anyone local. I’ll post the place in the Kolkata WhatsApp group.',
        hoursAgo: 12,
        votes: 4,
      },
    ],
  },
  {
    id: 'sleep-schedule-tips-for-a-36-hour-hackathon',
    title: 'Sleep schedule tips for a 36-hour hackathon',
    body: text(
      'CodeStorm is 36 hours. Last time I stayed awake the whole time and my pitch was a mess. I could barely talk.',
      'How do you plan sleep at long hackathons? Shifts? Power naps? Is coffee a trap?'
    ),
    category: 'general',
    tags: ['tips', 'offline'],
    authorHandle: 'sneha-kulkarni',
    city: 'pune',
    hackathonSlug: 'codestorm-2026',
    hoursAgo: 30,
    votes: 64,
    replies: [
      {
        id: 'sleep-schedule-tips-for-a-36-hour-hackathon-r1',
        authorHandle: 'ananya-sharma',
        body: 'What works for my team: everyone gets one 3-hour sleep block, staggered, so two people are always building. The person pitching sleeps last, so they’re fresh for judging.',
        hoursAgo: 28,
        votes: 33,
      },
      {
        id: 'sleep-schedule-tips-for-a-36-hour-hackathon-r2',
        authorHandle: 'rohan-deshmukh',
        body: '20-minute power naps work better than you’d think. Set two alarms. Anything between 30 and 90 minutes and you wake up feeling worse.',
        hoursAgo: 27,
        votes: 19,
      },
      {
        id: 'sleep-schedule-tips-for-a-36-hour-hackathon-r3',
        authorHandle: 'arjun-iyer',
        body: 'Coffee is fine till about 4 AM. After that, water and a walk outside. And eat the actual meals, not just Maggi.',
        hoursAgo: 25,
        votes: 15,
      },
      {
        id: 'sleep-schedule-tips-for-a-36-hour-hackathon-r4',
        authorHandle: 'aarav-patil',
        body: 'Freeze features at hour 30. The last six hours are only for bug fixes, the demo video and sleep for whoever pitches.',
        hoursAgo: 20,
        votes: 22,
      },
    ],
  },
  {
    id: 'solo-or-team-for-my-first-hackathon',
    title: 'Solo or team for my first hackathon?',
    body: text(
      'I’m in civil engineering, so none of my classmates do hackathons. I can do data analysis in Python and a bit of Streamlit.',
      'Should I go solo for my first one, or join a team of strangers? I’m kind of scared of being the “useless” one in a team of CS students.'
    ),
    category: 'general',
    tags: ['beginners', 'teammates'],
    authorHandle: 'meera-nair',
    city: 'kochi',
    hoursAgo: 50,
    votes: 39,
    replies: [
      {
        id: 'solo-or-team-for-my-first-hackathon-r1',
        authorHandle: 'vikram-singh',
        body: 'Team, 100%. I’m mechanical and I pitch for my teams. Domain knowledge is a superpower: you actually understand floods and drainage, most CS teams just guess.',
        hoursAgo: 48,
        votes: 26,
      },
      {
        id: 'solo-or-team-for-my-first-hackathon-r2',
        authorHandle: 'ishita-reddy',
        body: 'Agree. Python plus Streamlit is a working dashboard in an afternoon. That’s a real role on any team. Post on Team Finder with Data as your skill.',
        hoursAgo: 45,
        votes: 18,
      },
      {
        id: 'solo-or-team-for-my-first-hackathon-r3',
        authorHandle: 'priya-wankhede',
        body: 'Same boat! If you want to try an online one first, BuildFest Online is beginner-friendly and you can join solo. Less pressure.',
        hoursAgo: 40,
        votes: 9,
      },
      {
        id: 'solo-or-team-for-my-first-hackathon-r4',
        authorHandle: 'meera-nair',
        body: 'Okay, posting on Team Finder tonight. Thanks for not making me feel silly.',
        hoursAgo: 36,
        votes: 6,
      },
    ],
  },
  {
    id: 'find-hackathons-posted-only-on-instagram-or-whatsapp',
    title: 'How to find hackathons posted only on Instagram or WhatsApp?',
    body: text(
      'A lot of Jaipur college events never show up on Unstop or Devfolio. I found out about Pink City Ideathon from a forwarded WhatsApp poster, three days before the deadline.',
      'How do you keep track of events that only live on Instagram pages and WhatsApp groups?'
    ),
    category: 'resources',
    tags: ['instagram', 'whatsapp', 'tips'],
    authorHandle: 'vikram-singh',
    city: 'jaipur',
    hackathonSlug: 'pink-city-ideathon',
    hoursAgo: 80,
    votes: 47,
    replies: [
      {
        id: 'find-hackathons-posted-only-on-instagram-or-whatsapp-r1',
        authorHandle: 'ananya-sharma',
        body: 'Use the HackathonFinder quick share at /submit. Paste the Instagram link or the WhatsApp forward, or upload the poster. It reads the dates and details, and once it’s checked the event shows up for everyone. Takes 20 seconds.',
        hoursAgo: 76,
        votes: 31,
      },
      {
        id: 'find-hackathons-posted-only-on-instagram-or-whatsapp-r2',
        authorHandle: 'sneha-kulkarni',
        body: 'Also join your city’s WhatsApp group from the Community page. People drop posters there all the time.',
        hoursAgo: 70,
        votes: 14,
      },
      {
        id: 'find-hackathons-posted-only-on-instagram-or-whatsapp-r3',
        authorHandle: 'dev-shah',
        body: 'And save the ones you like. You get a nudge before the deadline, so the “found it three days before” problem goes away.',
        hoursAgo: 60,
        votes: 10,
      },
      {
        id: 'find-hackathons-posted-only-on-instagram-or-whatsapp-r4',
        authorHandle: 'vikram-singh',
        body: 'Just shared two posters from my college clubs through /submit. Super easy, thanks!',
        hoursAgo: 50,
        votes: 7,
      },
    ],
  },
  {
    id: 'hostel-wifi-died-mid-demo-backup-plans',
    title: 'Hostel wifi died mid-demo: backup plans?',
    body: text(
      'Online round of BuildFest yesterday. Two minutes into our demo the hostel wifi died. The judges waited a minute and then moved on to the next team.',
      'We still made it to the next round somehow. How do you prepare for the internet dying during an online demo?'
    ),
    category: 'general',
    tags: ['web-dev', 'online', 'demo-day'],
    authorHandle: 'zoya-khan',
    city: 'mumbai',
    hackathonSlug: 'buildfest-online',
    hoursAgo: 7,
    votes: 57,
    replies: [
      {
        id: 'hostel-wifi-died-mid-demo-backup-plans-r1',
        authorHandle: 'kabir-rao',
        body: 'Record a backup demo video the night before. If anything breaks, say “let me play the recording” and share it. Most judges are fine with that.',
        hoursAgo: 6,
        votes: 34,
      },
      {
        id: 'hostel-wifi-died-mid-demo-backup-plans-r2',
        authorHandle: 'dev-shah',
        body: 'Keep your phone hotspot ready with data left, and practise switching to it once. 4G is usually enough for a video call.',
        hoursAgo: 5,
        votes: 21,
      },
      {
        id: 'hostel-wifi-died-mid-demo-backup-plans-r3',
        authorHandle: 'riya-sen',
        body: 'Deploy before the demo, never run it on localhost. Then a teammate on a different network can take over the screen share if you drop.',
        hoursAgo: 4,
        votes: 18,
      },
      {
        id: 'hostel-wifi-died-mid-demo-backup-plans-r4',
        authorHandle: 'zoya-khan',
        body: 'Recording the video tonight, and my teammate in Thane is the backup presenter. Thanks, all!',
        hoursAgo: 2,
        votes: 5,
      },
    ],
  },
  {
    id: 'indore-smart-city-challenge-building-a-team',
    title: 'Indore folks: building a team for the Smart City Challenge',
    body: text(
      'Indore Smart City Challenge is hybrid with teams of up to four. Idea: track garbage pickup ward by ward with a simple app for sanitation workers. Indore is already the cleanest city, let’s make it data-driven too.',
      'I do backend (Node, Postgres). Looking for a frontend dev and someone who likes maps or data. Online teammates from other cities are welcome.'
    ),
    category: 'team-up',
    tags: ['smart-cities', 'climate', 'teammates'],
    authorHandle: 'harsh-jain',
    city: 'indore',
    hackathonSlug: 'indore-smart-city-challenge',
    hoursAgo: 100,
    votes: 19,
    replies: [
      {
        id: 'indore-smart-city-challenge-building-a-team-r1',
        authorHandle: 'riya-sen',
        body: 'Remote frontend from Kolkata, if you want! I love building map UIs.',
        hoursAgo: 96,
        votes: 6,
      },
      {
        id: 'indore-smart-city-challenge-building-a-team-r2',
        authorHandle: 'meera-nair',
        body: 'I can take the data side: ward-wise dashboards in Streamlit, or a simple heat map.',
        hoursAgo: 90,
        votes: 5,
      },
      {
        id: 'indore-smart-city-challenge-building-a-team-r3',
        authorHandle: 'harsh-jain',
        body: 'Both of you, yes! That’s a full team. Sending requests on Team Finder.',
        hoursAgo: 85,
        votes: 3,
      },
    ],
  },
  {
    id: 'fintech-sprint-mumbai-or-gift-city-fintech-hack',
    title: 'FinTech Sprint Mumbai or GIFT City FinTech Hack?',
    body: text(
      'Both look good and the dates are close. GIFT City is near home for me, and Mumbai has more companies around.',
      'Neither is marked beginner-friendly. Has anyone done either? Which is better for a 3rd year who has built a couple of UPI-style apps?'
    ),
    category: 'hackathon-qa',
    tags: ['fintech', 'travel'],
    authorHandle: 'dev-shah',
    city: 'ahmedabad',
    hackathonSlug: 'gift-city-fintech-hack',
    hoursAgo: 130,
    votes: 22,
    replies: [
      {
        id: 'fintech-sprint-mumbai-or-gift-city-fintech-hack-r1',
        authorHandle: 'zoya-khan',
        body: 'From Mumbai: FinTech Sprint teams are a mix of students and young professionals, so the level is high. Great for meeting people though.',
        hoursAgo: 125,
        votes: 9,
      },
      {
        id: 'fintech-sprint-mumbai-or-gift-city-fintech-hack-r2',
        authorHandle: 'kabir-rao',
        body: 'Go where your whole team can be there in person. Travel and stay eat into build time more than you think.',
        hoursAgo: 120,
        votes: 8,
      },
      {
        id: 'fintech-sprint-mumbai-or-gift-city-fintech-hack-r3',
        authorHandle: 'dev-shah',
        body: 'Makes sense. Going with GIFT City then. Will post an update after!',
        hoursAgo: 110,
        votes: 2,
      },
    ],
  },
];

export function threadById(id: string): Thread | undefined {
  return THREADS.find((t) => t.id === id);
}

export function categoryById(id: string): DiscussionCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function isCategoryId(id: string): id is CategoryId {
  return CATEGORIES.some((c) => c.id === id);
}

export function isThemeTag(tag: string): boolean {
  return THEMES.some((t) => t.slug === tag);
}

/** Theme tags show the theme name; free tags show as #tag. */
export function tagLabel(tag: string): string {
  const theme = THEMES.find((t) => t.slug === tag);
  return theme ? theme.name : `#${tag}`;
}

/** First paragraph on one line, for previews and meta descriptions. */
export function excerpt(body: string, max = 160): string {
  const first = body.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}
