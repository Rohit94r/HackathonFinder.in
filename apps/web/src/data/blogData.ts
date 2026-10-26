import { seoBlogPosts } from './blogSeoPosts';

export type BlogCategory = 'Guides' | 'Teams' | 'Pitching' | 'Inside HackathonFinder';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string; // 1–2 sentences, plain text
  category: BlogCategory;
  author: string; // always 'HackathonFinder Team'
  date: string; // display string like '18 Oct 2026'
  readMinutes: number;
  theme: string; // cover-art theme slug
  contentHtml: string; // article body HTML
  keywords?: string[]; // search phrases the post targets (meta keywords, JSON-LD)
  faqs?: { q: string; a: string }[]; // also in the body; sent as FAQPage JSON-LD
  updated?: string; // display date of the last real revision
}

const guidePosts: BlogPost[] = [
  {
    slug: 'how-to-win-your-first-hackathon',
    title: 'How to win your first hackathon',
    excerpt:
      'Winning a first hackathon is less about genius code and more about a sharp idea, a working demo and smart use of time. Here’s a practical plan from registration to the final pitch.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '18 Oct 2026',
    readMinutes: 4,
    theme: 'open-innovation',
    contentHtml: `<p>Your first hackathon can feel like walking into an exam where everyone else studied a different syllabus. Teams talk fast, someone already has a design file open, and you’re still reading the problem statement. The good news: most hackathons are not won by the smartest coder in the room. They’re won by teams that pick a sharp problem, build a small thing that works and explain it well.</p>
<p>Here’s a plan you can actually follow.</p>
<h2>Before the event</h2>
<h3>1. Pick the right hackathon</h3>
<p>For a first attempt, choose an event with a theme you already care about and a format you can handle. A 24-hour online event during exam week is a bad idea; a weekend event in your city after your first internals is much better. On <a href="/hackathons">HackathonFinder</a> you can filter by city, online or offline, theme, team size and deadline, and the <a href="/calendar">calendar</a> makes clashes with college commitments easy to spot.</p>
<h3>2. Read the rules twice</h3>
<p>The judging criteria tell you exactly what to aim for. If impact and presentation carry as much weight as technical depth, plan your time that way. Check eligibility, team size limits, whether you can use code written before the event and what you must submit: a repo, a video, a deck or all three.</p>
<h3>3. Prepare your setup, not your project</h3>
<p>Most events don’t allow pre-built projects, but they do allow preparation. Install your tools, make sure everyone can push to a shared repo, keep a starter template ready and decide who handles frontend, backend, design and the pitch. Still short of people? Post on the <a href="/teams">Team Finder board</a>.</p>
<h2>During the event</h2>
<h3>4. Spend the first hour on the problem</h3>
<p>Resist the urge to start coding straight away. Write one sentence: <em>we help a specific person do a specific thing because of a specific pain.</em> If you can’t fill that in, you don’t have an idea yet. “An app for farmers” is vague. “A voice-first flow that tells a small farmer today’s market price for one crop” is something judges can picture.</p>
<h3>5. Build the demo path first</h3>
<p>Decide the one flow you’ll show on stage, then build only what that flow needs. Login screens, settings pages and admin panels can wait or be faked. A demo that works end to end for one scenario beats a half-finished platform with ten features.</p>
<h3>6. Use checkpoints</h3>
<p>Check in every few hours: what’s done, what’s blocked, what we’re cutting. Cutting scope early is a skill, not a failure. In the last quarter of the event, stop adding features and focus on making what you have stable.</p>
<h3>7. Sleep a little</h3>
<p>Tired teams write silly bugs and mumble through pitches. Take turns resting, eat proper food and keep water nearby. A short nap at 3 a.m. can save you two hours of debugging later.</p>
<h2>At the finish line</h2>
<h3>8. Practise the pitch out loud</h3>
<p>Run through the pitch at least three times before you present. Know who says what, keep a screen recording of the demo in case the Wi-Fi fails, and put your strongest moment, the live demo, in the middle rather than at the end where you might run out of time. Our three-minute pitch guide on this blog goes deeper on this.</p>
<h3>9. Submit early</h3>
<p>Upload portals slow down in the final minutes. Submit a working version an hour before the deadline and update it later if the platform allows.</p>
<h2>Win or not, collect the real prizes</h2>
<p>Not every first hackathon ends with prize money in ₹. But you walk away with a project for your resume, a public repo, new friends and a much better feel for working under pressure. Write down what went well and what you’d change, then pick the next event. Save a few upcoming ones to <a href="/saved">My hackathons</a> so you can track each one from saved to registered to submitted.</p>
<blockquote>A simple rule: the goal of your first hackathon is to finish. The goal of your second is to win.</blockquote>`,
  },
  {
    slug: 'find-the-right-teammates',
    title: 'How to find the right teammates for a hackathon',
    excerpt:
      'A good team isn’t four people who are all great at the same framework. Here’s how to find teammates whose skills, schedules and goals actually fit.',
    category: 'Teams',
    author: 'HackathonFinder Team',
    date: '15 Oct 2026',
    readMinutes: 4,
    theme: 'web-dev',
    contentHtml: `<p>Ask anyone who has done a few hackathons and they’ll tell you the team matters more than the idea. A clever idea with a team that can’t agree on anything goes nowhere. An ordinary idea with a team that communicates well often ends up on the shortlist.</p>
<p>So how do you find people who make you better, not more stressed?</p>
<h2>Start with roles, not friends</h2>
<p>It’s tempting to team up with your three closest friends from the same branch. Sometimes that works. Often, though, you end up with four backend developers and nobody who can design a screen or speak to judges. Before you invite anyone, list the roles your project will probably need:</p>
<ul>
<li><strong>Builders:</strong> people who can ship frontend, backend or both.</li>
<li><strong>Designer:</strong> someone who can make the product clear and usable, even if it’s simple.</li>
<li><strong>Domain person:</strong> someone who understands the problem, whether that’s healthcare, finance, farming or whatever the theme is.</li>
<li><strong>Storyteller:</strong> the person who owns the pitch, the deck and the demo video.</li>
</ul>
<p>One person can cover two roles. The point is that every role has an owner.</p>
<h2>Where to look</h2>
<ol>
<li><strong>Your college clubs.</strong> Coding clubs, design societies, entrepreneurship cells and developer communities are full of people looking for teams.</li>
<li><strong>Other branches.</strong> A mechanical, electronics or biotech student can bring the domain knowledge a pure CS team lacks.</li>
<li><strong>The event’s own community.</strong> Many hackathons run a chat group for team formation. Introduce yourself early with your skills and what you want to build.</li>
<li><strong>Team Finder on HackathonFinder.</strong> Our <a href="/teams">Team Finder board</a> lets you post what you can do and what you’re looking for, or browse people who are already searching for teammates for a specific event.</li>
</ol>
<h2>Write a post people want to answer</h2>
<p>“Need team, DM” gets ignored. Be specific, like this:</p>
<blockquote>Third-year IT student in Pune, comfortable with React and Firebase. Looking for a backend developer and a designer for an offline health-tech hackathon next month. I’d like to build something around clinic queues. Free on weekends.</blockquote>
<p>In four lines that tells people your skills, your location, the event, your idea and your availability.</p>
<h2>Have the awkward conversation early</h2>
<p>Before you register together, spend fifteen minutes on a call and talk through:</p>
<ul>
<li><strong>Goals.</strong> Is everyone trying to win, or is someone mainly here to learn? Both are fine, but mismatched expectations cause fights at 2 a.m.</li>
<li><strong>Availability.</strong> Who has internals, a fest or a family function that weekend?</li>
<li><strong>Tools.</strong> Agree on the stack, the repo and where you’ll chat.</li>
<li><strong>Decisions.</strong> Who has the final say when you’re stuck between two options? Usually it’s whoever owns that part of the work.</li>
<li><strong>Prize split.</strong> If there’s prize money, agree now that it’s shared equally. That’s far easier to say before there’s money on the table.</li>
</ul>
<h2>Try a small test</h2>
<p>If you’re teaming up with people you’ve never worked with, do a tiny warm-up. Build a small to-do app together in one evening, or have everyone sketch the idea separately and compare notes. You’ll quickly learn who communicates, who goes quiet and who over-engineers everything.</p>
<h2>Signs you’ve found a good teammate</h2>
<ul>
<li>They reply in reasonable time, and they say so when they can’t.</li>
<li>They ask questions about the problem, not just the tech.</li>
<li>They’re happy to cut a feature to make a deadline.</li>
<li>They give credit freely and take responsibility for their part.</li>
</ul>
<h2>Keep the team together</h2>
<p>Once your team is set, save the event to <a href="/saved">My hackathons</a> so you can track it from registration to submission, and share the key dates with everyone. Afterwards, check the <a href="/calendar">calendar</a> for the next event you could do together. A team that has survived one hackathon already knows how each person works, and that head start is worth a lot the second time round.</p>`,
  },
  {
    slug: 'pitch-your-project-in-three-minutes',
    title: 'How to pitch your hackathon project in three minutes',
    excerpt:
      'Judges see a lot of projects in one day. A simple three-minute structure of problem, demo, how it works and why it matters helps yours stand out.',
    category: 'Pitching',
    author: 'HackathonFinder Team',
    date: '12 Oct 2026',
    readMinutes: 4,
    theme: 'fintech',
    contentHtml: `<p>You built something real in a day and a half. Now you have three minutes, sometimes less, to convince tired judges that it matters. Plenty of good projects lose at this stage, not because the code was weak but because the pitch was a tour of features with no story.</p>
<p>Here’s a structure that fits three minutes and works for almost any theme.</p>
<h2>The three-minute structure</h2>
<h3>0:00 to 0:30: the problem</h3>
<p>Start with a person and a pain, not with your tech stack. Make it concrete. “Small shop owners near our college track credit in a notebook and lose count of who owes what” is far stronger than “financial inclusion is a big challenge”. If you spoke to real users during the event, even two or three, say so.</p>
<h3>0:30 to 1:45: the demo</h3>
<p>This is the heart of the pitch. Show one complete flow, from the user’s first tap to the moment the problem is solved. Narrate what the user is doing, not what the code is doing. Keep the data realistic: a shop name, a few customers, believable amounts in ₹.</p>
<h3>1:45 to 2:20: how it works</h3>
<p>Now you can talk tech, briefly. One slide or a couple of sentences on the architecture, plus one thing that was genuinely hard or clever. Technical judges want to know you understand what you built; they don’t need a list of every library you installed.</p>
<h3>2:20 to 3:00: why it matters and what’s next</h3>
<p>Close with impact and a next step. Who else could use this? What would you build with another month? End on one memorable line that restates the problem and your answer to it.</p>
<h2>Prepare for things to break</h2>
<ul>
<li><strong>Record a backup video</strong> of the demo working. If the Wi-Fi or an API fails, play it calmly and keep talking.</li>
<li><strong>Use seeded data</strong> so you’re not typing during the demo.</li>
<li><strong>Close every other tab</strong> and silence notifications. Nobody needs to see your group chat on the projector.</li>
<li><strong>Bump up the font size.</strong> What looks fine on a laptop is unreadable from the back of a hall.</li>
</ul>
<h2>Slides: fewer than you think</h2>
<p>For a three-minute slot, four to six slides is plenty: title, problem, demo, how it works, impact and team. Use big text, one idea per slide and screenshots instead of paragraphs. If a slide needs you to say “as you can see”, it probably has too much on it.</p>
<h2>Who speaks?</h2>
<p>One main speaker keeps things smooth. A second teammate can drive the demo while the speaker narrates. Avoid passing the mic between four people; the handovers eat time and break the flow.</p>
<h2>Handling questions</h2>
<p>Q&amp;A is where judges test whether you really understand your project. A few habits help:</p>
<ol>
<li>Repeat or rephrase the question so you’re sure you heard it right.</li>
<li>Answer in one or two sentences, then stop.</li>
<li>If you don’t know, say so honestly and explain how you’d find out.</li>
<li>If a judge points out a limitation, agree and explain how you’d fix it next. A defensive answer costs more than the limitation itself.</li>
</ol>
<p>A few questions come up often enough to prepare for: How is this different from what already exists? How would you get your first users? What happens to user data? How would it sustain itself, if it needs to?</p>
<h2>Practise with a timer</h2>
<p>Run the full pitch at least three times with a stopwatch, ideally in front of someone outside your team. Cut anything that doesn’t serve the story. If you keep running over, trim the “how it works” section first. Never trim the demo.</p>
<p>Looking for your next stage? Browse upcoming events on <a href="/hackathons">HackathonFinder</a>, filter by theme if fintech or another area is your thing, and save the ones you like to <a href="/saved">My hackathons</a>.</p>`,
  },
  {
    slug: 'checklist-before-you-register',
    title: 'The checklist to run before you register for a hackathon',
    excerpt:
      'Eligibility, fees, dates, team rules and submission format: a few minutes of checking before you register can save you a wasted weekend.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '9 Oct 2026',
    readMinutes: 4,
    theme: 'ai-ml',
    contentHtml: `<p>Registering for a hackathon takes two minutes. Finding out on day one that you weren’t eligible, or that the final round clashes with your end-sem exams, costs a lot more than that. Before you hit register on the organiser’s page, run through this checklist.</p>
<h2>1. Is it real and current?</h2>
<p>Look for an official page from the organiser, whether that’s a college, a company, a community or a listing platform. Check that the dates are for this year’s edition, not last year’s. On HackathonFinder every listing shows its source and a “last checked” time, so you can see where the details came from and how fresh they are. Always confirm on the official page, because organisers can change things after we last checked.</p>
<h2>2. Are you eligible?</h2>
<ul>
<li>Is it open to all students, or only certain years, branches or one college?</li>
<li>Are recent graduates or working professionals allowed?</li>
<li>Is it limited to a particular city, state or country?</li>
<li>Do you need a valid college ID or a letter from your institute?</li>
</ul>
<h2>3. What does it cost?</h2>
<p>Many hackathons are free, but some charge a fee per person or per team. Check whether the fee covers food and stay for offline events, and whether refunds are possible. Use the free/paid filter on <a href="/hackathons">our listings</a> if you only want free events. Be careful with anything that asks you to pay through an unofficial channel with no clear organiser behind it.</p>
<h2>4. Do the dates actually work?</h2>
<p>Hackathons often have several dates, and it’s easy to miss one:</p>
<ul>
<li>Registration deadline</li>
<li>Idea or deck submission for shortlisting</li>
<li>Online rounds</li>
<li>Final round dates and timings</li>
<li>Result announcement</li>
</ul>
<p>Put these next to your academic calendar: internals, practicals, assignment deadlines and fests. The <a href="/calendar">HackathonFinder calendar</a> shows events side by side, so clashes are easier to spot.</p>
<h2>5. What are the team rules?</h2>
<ul>
<li>Minimum and maximum team size</li>
<li>Whether teams can mix members from different colleges</li>
<li>Whether there are any team composition requirements</li>
<li>Whether you can change members after registering</li>
</ul>
<p>Need one more person to meet the size rule? Try the <a href="/teams">Team Finder board</a>.</p>
<h2>6. What do you need to submit?</h2>
<p>Find out early whether you’ll need a pitch deck, a code repo, a demo video, a hosted link or a written report, and in what format. Note any word or slide limits. Some events ask for an idea submission before shortlisting, so you may need a solid one-page proposal before you write a single line of code.</p>
<h2>7. What about code and ownership?</h2>
<p>Check whether you can use code written before the event, open-source libraries or AI tools, and whether the organiser claims any rights over what you build. Sponsored hackathons sometimes have their own terms. If anything is unclear, ask the organisers before you register, not after you’ve built something.</p>
<h2>8. Logistics for offline events</h2>
<ul>
<li>The exact venue and how you’ll get there</li>
<li>Whether travel or stay is reimbursed</li>
<li>Food, Wi-Fi, power sockets and sleeping space for overnight events</li>
<li>Permission from your college if the event overlaps with classes</li>
</ul>
<h2>9. Prizes and perks</h2>
<p>Read how prizes are split between overall winners, track prizes and special mentions, when they’re paid, and whether there are certificates or other perks. Prizes shouldn’t be your only reason to join, but you should know what’s on offer.</p>
<h2>10. Track it</h2>
<p>Once everything checks out, save the event to <a href="/saved">My hackathons</a>, then move it from saved to registered after you’ve signed up on the organiser’s page. Deadline reminders are coming soon; until then, add the key dates to your phone’s calendar as well.</p>
<blockquote>Quick rule: if you can’t find the organiser, the dates and the eligibility rules within five minutes, treat that as a warning sign.</blockquote>`,
  },
  {
    slug: 'online-vs-offline-hackathons',
    title: 'Online vs offline hackathons: which should you pick?',
    excerpt:
      'Both formats are worth trying, but they reward different things. Here’s how to decide based on your goals, your semester and your budget.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '6 Oct 2026',
    readMinutes: 3,
    theme: 'climate',
    contentHtml: `<p>Search for hackathons and you’ll find two broad kinds: online events you join from your hostel room, and offline events where you turn up at a campus or office with a laptop and a backpack. Neither is better in general. Each suits different goals.</p>
<h2>Online hackathons</h2>
<h3>What’s good</h3>
<ul>
<li><strong>No travel cost.</strong> No train tickets, no stay and no missing two days of classes to get somewhere.</li>
<li><strong>Wider choice.</strong> You can join events run from anywhere, not just near your college.</li>
<li><strong>Flexible timing.</strong> Many online events run over several days or weeks, so you can work around lectures.</li>
<li><strong>Mixed teams are easy.</strong> Your teammates can be in different cities or colleges.</li>
</ul>
<h3>What’s hard</h3>
<ul>
<li><strong>Distractions.</strong> Family, roommates, classes and your phone all compete for attention.</li>
<li><strong>Coordination.</strong> Working over calls and chats is slower than turning to the person next to you.</li>
<li><strong>Less networking.</strong> It’s harder to chat casually with mentors, judges or other teams.</li>
<li><strong>Bigger fields.</strong> Open online events can draw entries from far and wide, so competition can be stiff.</li>
</ul>
<h2>Offline hackathons</h2>
<h3>What’s good</h3>
<ul>
<li><strong>Focus.</strong> Sitting with your team and a countdown on the wall does wonders for concentration.</li>
<li><strong>Mentors nearby.</strong> You can walk over and ask a question instead of waiting for a reply in a channel.</li>
<li><strong>People.</strong> You meet students from other colleges, organisers and sometimes people hiring interns.</li>
<li><strong>Energy.</strong> Live demos, late-night snacks and final presentations in a packed hall are hard to recreate on a call.</li>
</ul>
<h3>What’s hard</h3>
<ul>
<li><strong>Cost and travel.</strong> Even if entry is free, travel and food add up unless the organiser covers them.</li>
<li><strong>Time away.</strong> You may need leave from college and time to catch up on missed classes.</li>
<li><strong>Tiredness.</strong> Overnight events under bright lights with patchy Wi-Fi wear you out.</li>
</ul>
<h2>How to choose</h2>
<p>Ask yourself three questions:</p>
<ol>
<li><strong>What do I want from this event?</strong> If it’s learning and a portfolio project, online is a great start. If it’s meeting people, mentors or recruiters, go offline.</li>
<li><strong>What does my semester look like?</strong> During internals or lab-heavy weeks, a multi-day online event is easier to fit in. During breaks, an offline weekend event is ideal.</li>
<li><strong>What can I afford?</strong> Add up travel, stay and food for an offline event, and factor in any travel support the organiser offers.</li>
</ol>
<p>A pattern that works for many students: do one or two online hackathons to learn the rhythm, then try an offline event in or near your city. If you’re in Pune, look at events on campuses around the city first; short travel leaves more energy for building.</p>
<h2>Tips for each format</h2>
<h3>Online</h3>
<ul>
<li>Agree on fixed working hours and keep one call open during them.</li>
<li>Use a shared task board so everyone knows who’s doing what.</li>
<li>Test screen sharing and recording before the final demo.</li>
<li>Tell your family or roommates when you need quiet time.</li>
</ul>
<h3>Offline</h3>
<ul>
<li>Pack chargers, an extension board, a water bottle, a hoodie and your college ID.</li>
<li>Arrive early to get a table near a power point.</li>
<li>Talk to mentors in the first few hours, not just at the end.</li>
<li>Plan how you’ll get home safely if the event finishes late.</li>
</ul>
<h2>Finding both on HackathonFinder</h2>
<p>On the <a href="/hackathons">hackathons page</a>, combine the online/offline filter with city, theme and deadline to narrow things down. We’re starting with Pune and online events, so both formats are covered from day one. Found something interesting? Save it to <a href="/saved">My hackathons</a> and check the <a href="/calendar">calendar</a> to make sure it fits around your semester.</p>`,
  },
  {
    slug: 'how-hackathonfinder-finds-every-hackathon',
    title: 'How HackathonFinder finds hackathons and keeps listings honest',
    excerpt:
      'Where our listings come from, what our AI agents do, how we remove duplicates and check details, and the data rules we follow for every source.',
    category: 'Inside HackathonFinder',
    author: 'HackathonFinder Team',
    date: '3 Oct 2026',
    readMinutes: 4,
    theme: 'smart-cities',
    contentHtml: `<p>Hackathons are announced in a lot of places: listing platforms, college websites, club pages, social media posts and community groups. If you’ve ever tried to track them yourself, you know how easy it is to hear about a great one the day after registration closed. HackathonFinder exists to bring those announcements into one searchable place. Here’s how that works, and the rules we follow while doing it.</p>
<h2>Where listings come from</h2>
<p>We look across several kinds of sources:</p>
<ul>
<li><strong>Hackathon platforms</strong> such as Unstop, Devfolio, Devpost, MLH and HackerEarth, where many events are listed.</li>
<li><strong>College and club websites</strong>, which often announce events that don’t appear anywhere else.</li>
<li><strong>Web search</strong>, to pick up events posted on smaller sites.</li>
<li><strong>Instagram and LinkedIn events</strong>, which reach us through submissions from organisers and users, partners, our browser extension and official APIs. We don’t scrape anyone’s accounts.</li>
<li><strong>You.</strong> Anyone can tell us about an event through <a href="/submit">Submit a hackathon</a>.</li>
</ul>
<p>We’re starting with Pune and online events and will widen coverage over time. We won’t catch every single hackathon, which is exactly why submissions matter.</p>
<h2>The agents behind the scenes</h2>
<p>A set of AI agents handles the repetitive work, each with one clear job:</p>
<ol>
<li><strong>Scout</strong> looks for new and updated events across our sources.</li>
<li><strong>Extractor</strong> pulls out the details that matter: name, organiser, dates, deadline, mode, city, team size, eligibility, fees and prizes.</li>
<li><strong>Deduper</strong> spots when the same event appears in several places and merges those into one listing.</li>
<li><strong>Verifier</strong> checks the details against the official source and flags anything that doesn’t add up.</li>
<li><strong>Tagger</strong> adds themes and labels so filters like AI/ML, fintech or free events work properly.</li>
<li><strong>Writer</strong> writes a short, original summary of the event in plain language.</li>
<li><strong>Publisher</strong> puts the finished listing live and updates it when details change.</li>
</ol>
<p>Splitting the work this way makes each step easier to check and improve. A tagging mistake, for example, can be fixed without touching how events are found.</p>
<h2>Why deduplication matters</h2>
<p>One hackathon might be listed on a platform, announced on a college site and shared on social media, sometimes with slightly different names or dates. Without deduplication you’d see three cards for one event and wonder which is right. Deduper compares names, organisers, dates and links to group them, and the listing keeps a link to the official page so you always know where to register.</p>
<h2>Verification and “last checked”</h2>
<p>Event details change. Deadlines get extended, venues move and extra rounds get added. So every listing clearly shows two things:</p>
<ul>
<li><strong>Its source</strong>, with a link back to where the information came from.</li>
<li><strong>A “last checked” time</strong>, so you know how fresh the details are.</li>
</ul>
<p>We work hard to keep listings accurate, but the organiser’s official page is always the final word. We don’t host registration either: when you click register, you go straight to the organiser’s own page.</p>
<h2>The data rules we follow</h2>
<ul>
<li>We follow each site’s terms of use.</li>
<li>We use official APIs and feeds wherever they exist.</li>
<li>Instagram and LinkedIn events come from submissions, partners, our browser extension and official APIs, not from scraping accounts.</li>
<li>We always link back to the original source.</li>
<li>We write our own short summaries instead of copying organisers’ descriptions.</li>
</ul>
<h2>How you can help</h2>
<p>If you organise a hackathon or spot one we’ve missed, add it through <a href="/submit">Submit a hackathon</a>. If a listing looks wrong, tell us in the <a href="/community">community</a> so we can recheck it. A weekly digest and deadline reminders are coming soon; for now, save events to <a href="/saved">My hackathons</a> to keep track of them. For more on the process, see <a href="/how-it-works">How it works</a>.</p>`,
  },
];

/** A post's display date ('18 Oct 2026') as an ISO date, for sitemaps and structured data. */
export function postIsoDate(date: string): string {
  const t = Date.parse(`${date} 00:00:00 GMT+0530`);
  return Number.isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
}

/** Every post, newest first. */
export const blogPosts: BlogPost[] = [...seoBlogPosts, ...guidePosts].sort((a, b) => Date.parse(postIsoDate(b.date)) - Date.parse(postIsoDate(a.date)));
