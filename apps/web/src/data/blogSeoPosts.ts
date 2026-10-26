import type { BlogPost } from './blogData';

/**
 * Long-form, search-focused guides. Each one targets a high-intent query,
 * carries its own keywords and FAQs (rendered as FAQPage JSON-LD) and ends
 * with a matching "Frequently asked questions" section in the body.
 */
export const seoBlogPosts: BlogPost[] = [
  {
    slug: 'upcoming-hackathons-in-india',
    title: 'Upcoming hackathons in India for students: 2026–27 guide',
    excerpt:
      'Where to find upcoming hackathons in India in 2026 and 2027, how the main platforms compare and what each season of the student year usually brings.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '26 Oct 2026',
    readMinutes: 7,
    theme: 'social-impact',
    keywords: [
      'upcoming hackathons in India',
      'upcoming hackathons in India 2026',
      'hackathons in India 2027',
      'hackathons for students in India',
      'college hackathons India',
      'Unstop vs Devfolio',
      'how to find hackathons',
      'hackathon calendar India',
    ],
    faqs: [
      {
        q: 'Where can I find upcoming hackathons in India?',
        a: 'On listing platforms such as Unstop, Devfolio, Devpost, MLH and HackerEarth, on college fest and club pages, and on social media. HackathonFinder brings these into one searchable list with filters for city, theme, deadline, team size and prize, and links every listing back to its source.',
      },
      {
        q: 'Are there hackathons for first-year students in India?',
        a: 'Yes. Many college, community and online hackathons are open to all years, and some are aimed at beginners. Check the eligibility section on the organiser’s page, because a few events are limited to certain years, branches or colleges.',
      },
      {
        q: 'When do most hackathons happen in India?',
        a: 'They run all year, but some patterns repeat. Campus events pick up after colleges reopen, many tech fests with offline hackathons fall between January and March, and online events tend to fill the summer break. Always confirm exact dates on the official page.',
      },
      {
        q: 'Do I have to pay to join a hackathon?',
        a: 'Many hackathons are free to enter. Some charge a fee per person or per team, especially offline events that include food or stay. Use the free filter on HackathonFinder if you only want free events, and never pay through an unofficial channel.',
      },
      {
        q: 'Which hackathon platform is best for Indian students?',
        a: 'There isn’t a single best one. Unstop and Devfolio carry many Indian events, Devpost and MLH are strong for online and international ones, and HackerEarth is often linked to hiring. Most students use two or three, or one aggregator that covers them all.',
      },
    ],
    contentHtml: `<p>Upcoming hackathons in India are announced in a dozen places at once: platforms like Unstop and Devfolio, college fest pages, company career sites, Instagram posts and WhatsApp groups. If you’re a student looking for hackathons in India in 2026 and 2027, the hard part isn’t a shortage of events. It’s seeing them in time, before registration closes. This guide covers where hackathons for students in India are listed, how the main platforms differ, what each part of the academic year tends to look like and a simple weekly routine so you stop hearing about good events a day too late.</p>
<h2>Where are upcoming hackathons in India announced?</h2>
<p>Most events show up in at least one of these places:</p>
<ul>
<li><strong>Listing platforms.</strong> Unstop, Devfolio, Devpost, MLH and HackerEarth host or list a large share of student hackathons.</li>
<li><strong>College websites and fest pages.</strong> Tech fests and coding clubs often run hackathons that are announced only on their own site or social handles.</li>
<li><strong>Company and community pages.</strong> Startups, developer communities and larger tech companies run hackathons to find talent or get developers to try a product.</li>
<li><strong>Government and institutional programmes.</strong> National events such as Smart India Hackathon usually begin with internal rounds inside colleges, so keep an eye on your own institute’s notices as well.</li>
<li><strong>Social media and chat groups.</strong> Instagram and LinkedIn posts, plus WhatsApp, Discord and Telegram groups, are where many smaller college events spread first.</li>
</ul>
<p>Checking all of these every week is a chore. That’s why <a href="/hackathons">HackathonFinder</a> brings them into one list with filters for city, theme, deadline, team size, mode and prize. Each listing links back to its source, so you always register on the organiser’s own page.</p>
<h2>How do Unstop, Devfolio, Devpost, MLH and HackerEarth compare?</h2>
<p>Each platform has its own flavour. These are broad patterns rather than rules, and any platform can host any kind of event.</p>
<h3>Unstop</h3>
<p>An Indian platform that lists hackathons alongside case competitions, quizzes and hiring challenges. Many company-sponsored and college-run events use it, and multi-round formats are common: an online idea or quiz round first, then a shortlist for the build round.</p>
<h3>Devfolio</h3>
<p>Popular with student-run hackathons in India, including many in-person events organised by college communities. You build a profile once and apply to events with it. Some events review applications before confirming your place, so a filled-in profile with links to past work helps.</p>
<h3>Devpost</h3>
<p>A global platform with a lot of online hackathons run by companies and communities. It’s useful when you want events you can join from anywhere, but deadlines are often shown in a foreign time zone, so convert them to IST carefully.</p>
<h3>MLH</h3>
<p>Major League Hacking is a student hackathon league. It partners with member events around the world, including some in India, and runs its own online events. MLH-affiliated events follow a shared code of conduct, which many first-timers find reassuring.</p>
<h3>HackerEarth</h3>
<p>Known for company-run hackathons and coding challenges that are often linked to hiring. Worth watching if you’re in your final year or a recent graduate and want events where recruiters are actually paying attention.</p>
<p>You don’t have to pick one. Most active students end up with accounts on two or three. The real problem is keeping track of deadlines spread across all of them, which is where a single list and a <a href="/calendar">calendar view</a> help.</p>
<h2>What does each season of the year usually look like?</h2>
<p>Every year is different and organisers move dates around, but the Indian academic calendar does create some patterns worth knowing.</p>
<h3>July to September: a new semester</h3>
<p>Colleges reopen, clubs recruit new members and internal hackathons start up. It’s a good window for first-years and second-years to try a small campus event. Some national programmes run their internal college rounds around this time too.</p>
<h3>October to December: busy and crowded</h3>
<p>Plenty of college and community events cluster here, alongside open-source drives. Mid-semester exams also land in this stretch, so check event dates against your academic calendar before you commit.</p>
<h3>January to March: fest season</h3>
<p>Many college tech fests happen in these months, and fests often include offline hackathons, sometimes with overnight venues or travel support. If you want the full in-person experience, this is often the richest window.</p>
<h3>April to June: exams, then summer</h3>
<p>End-semester exams make April and May quieter for offline events. Once exams are over, online hackathons and company challenges tend to fill the summer, which suits students who are at home and have time to build.</p>
<blockquote>Treat these as tendencies, not a timetable. The only dates you can rely on are the ones on the organiser’s official page.</blockquote>
<h2>How do you find hackathons for students in India before deadlines pass?</h2>
<p>A ten-minute routine once a week is enough for most students:</p>
<ol>
<li><strong>Start from one list.</strong> Open <a href="/hackathons">all hackathons</a> and filter by what matters to you: online or offline, your city, a theme, free entry or team size.</li>
<li><strong>Sort by deadline.</strong> Registration often closes weeks before the event itself. Sorting by the closest deadline shows what needs action this week.</li>
<li><strong>Check what’s close by.</strong> <a href="/near-me">Hackathons near me</a> shows in-person events nearest first, so you can spot ones you can reach without a long trip.</li>
<li><strong>Plan on the calendar.</strong> The <a href="/calendar">calendar</a> puts events side by side, so clashes with internals, fests or other hackathons are easy to see.</li>
<li><strong>Save and track.</strong> Save the events you like and move each one from saved to registered to submitted as you go.</li>
<li><strong>Let the list come to you.</strong> The <a href="/digest">weekly digest</a> sends open hackathons for your cities and themes, plus deadlines closing soon, every Monday.</li>
</ol>
<h2>Which hackathons should you actually pick?</h2>
<p>Choose based on what you want from the event, not the biggest prize on the page.</p>
<ul>
<li><strong>To learn:</strong> beginner-friendly online events with mentors and a longer build window. Our guide to <a href="/blog/free-online-hackathons-for-beginners">free online hackathons for beginners</a> covers where to start.</li>
<li><strong>To meet people:</strong> offline events in or near your city. The <a href="/blog/online-vs-offline-hackathons">online vs offline guide</a> walks through the trade-offs.</li>
<li><strong>For your resume:</strong> any event where you can finish something real and demo it. Finishing matters more than the event’s size.</li>
<li><strong>For a specific field:</strong> filter by theme, such as AI/ML, fintech, healthtech or climate, and look for events with tracks that match.</li>
</ul>
<p>Short of teammates? Post on the <a href="/teams">Team Finder board</a> with your skills and the event you have in mind. Before registering anywhere, run through our <a href="/blog/checklist-before-you-register">checklist before you register</a>: eligibility, fees, dates, team rules and submission format.</p>
<h2>How do you avoid fake or outdated listings?</h2>
<p>The most common trap isn’t a scam. It’s an old page from last year’s edition that still ranks in search results. Check the year on every date, look for a named organiser and an official page, and be wary of anyone asking for fees through a personal payment link or an unofficial form.</p>
<p>On HackathonFinder every listing shows its source and a “last checked” time, and duplicates from different platforms are merged into one card. You can read more in <a href="/blog/how-hackathonfinder-finds-every-hackathon">how HackathonFinder finds hackathons</a>. If you spot an event we’ve missed, or one that looks wrong, <a href="/submit">submit it</a> or raise it in the <a href="/community">community</a>.</p>
<h2>Frequently asked questions</h2>
<h3>Where can I find upcoming hackathons in India?</h3>
<p>On listing platforms such as Unstop, Devfolio, Devpost, MLH and HackerEarth, on college fest and club pages, and on social media. HackathonFinder brings these into one searchable list with filters for city, theme, deadline, team size and prize, and links every listing back to its source.</p>
<h3>Are there hackathons for first-year students in India?</h3>
<p>Yes. Many college, community and online hackathons are open to all years, and some are aimed at beginners. Check the eligibility section on the organiser’s page, because a few events are limited to certain years, branches or colleges.</p>
<h3>When do most hackathons happen in India?</h3>
<p>They run all year, but some patterns repeat. Campus events pick up after colleges reopen, many tech fests with offline hackathons fall between January and March, and online events tend to fill the summer break. Always confirm exact dates on the official page.</p>
<h3>Do I have to pay to join a hackathon?</h3>
<p>Many hackathons are free to enter. Some charge a fee per person or per team, especially offline events that include food or stay. Use the free filter on HackathonFinder if you only want free events, and never pay through an unofficial channel.</p>
<h3>Which hackathon platform is best for Indian students?</h3>
<p>There isn’t a single best one. Unstop and Devfolio carry many Indian events, Devpost and MLH are strong for online and international ones, and HackerEarth is often linked to hiring. Most students use two or three, or one aggregator that covers them all.</p>`,
  },
  {
    slug: 'hackathons-near-me',
    title: 'Hackathons near me: how to find offline events in your city',
    excerpt:
      'Searching for hackathons near me? How to find offline hackathons in Pune, Mumbai, Bengaluru, Delhi, Hyderabad and Chennai, and which are worth the trip.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '25 Oct 2026',
    readMinutes: 6,
    theme: 'smart-cities',
    keywords: [
      'hackathons near me',
      'offline hackathons near me',
      'hackathons in Pune',
      'hackathons in Mumbai',
      'hackathons in Bengaluru',
      'hackathons in Delhi',
      'hackathons in Hyderabad',
      'hackathons in Chennai',
      'in-person hackathons India',
    ],
    faqs: [
      {
        q: 'How do I find hackathons near me?',
        a: 'Open the Hackathons near me page on HackathonFinder and share your location or pick your city. In-person events are shown nearest first, followed by online events you can join from anywhere. You can also browse city pages and add filters for theme, deadline and team size.',
      },
      {
        q: 'Which Indian cities have the most offline hackathons?',
        a: 'Cities with many engineering colleges and tech companies, such as Bengaluru, Pune, Hyderabad, Mumbai, Delhi NCR and Chennai, tend to see regular in-person events. The mix changes through the year, so check current listings rather than relying on reputation.',
      },
      {
        q: 'Are offline hackathons free?',
        a: 'Many are free to enter, and some include food and a place to rest during overnight events. Others charge a registration fee. Travel is usually your own cost unless the organiser offers travel support, so read the logistics section before you register.',
      },
      {
        q: 'Can I join an offline hackathon in another city?',
        a: 'Usually yes, unless eligibility is limited to one college, city or state. Budget for travel, food and stay, check whether travel is reimbursed, and get permission from your college if the event overlaps with classes.',
      },
    ],
    contentHtml: `<p>Searching for “hackathons near me” usually returns a mix of last year’s events, online contests and pages from cities you can’t reach this weekend. If you want an offline hackathon you can actually get to, whether that’s in Pune, Mumbai, Bengaluru, Delhi, Hyderabad or Chennai, you need two things: a list sorted by distance and a quick way to judge whether an event is worth the trip. This guide covers both, plus how to find the small local events that never make it onto the big platforms.</p>
<h2>How does “hackathons near me” work on HackathonFinder?</h2>
<p>The <a href="/near-me">Hackathons near me</a> page does one job: it shows the in-person events closest to you first. Share your location in the browser, or pick your city if you’d rather not, and the list sorts offline hackathons by distance. Online events appear after them, since you can join those from anywhere.</p>
<p>From there you can narrow things down with the same filters as the main <a href="/hackathons">hackathons page</a>: theme, deadline, team size, free or paid, and prize. If you’d rather browse by place, the <a href="/cities">cities page</a> lists every city we cover, each with its own page of upcoming events.</p>
<h2>Why go to an offline hackathon near you?</h2>
<p>Online events are easier to fit into a semester, but a nearby offline hackathon gives you things a video call can’t:</p>
<ul>
<li><strong>Focus.</strong> A room full of teams and a countdown clock makes it much easier to work for long stretches.</li>
<li><strong>Mentors in person.</strong> You can walk up to a mentor with a half-broken demo and get help in minutes.</li>
<li><strong>Local people.</strong> You meet students from other colleges in your city, plus organisers, community leads and sometimes people hiring interns. Those contacts are easier to keep when you live in the same place.</li>
<li><strong>Lower cost.</strong> A short local trip means no long train journey or hotel, and you can sleep in your own bed if the event isn’t overnight.</li>
</ul>
<p>If you’re still deciding between formats, our <a href="/blog/online-vs-offline-hackathons">online vs offline hackathons</a> guide goes through the trade-offs in detail.</p>
<h2>Offline hackathons in major Indian cities</h2>
<p>Every city has its own rhythm. These are general patterns, not promises about any particular month, so always check current listings.</p>
<h3>Pune</h3>
<p>Pune has a large number of engineering colleges and a strong IT and product presence, so campus hackathons, club events and company-run challenges all show up regularly. It’s also where HackathonFinder started, so our coverage there is the most complete. See <a href="/cities/pune">hackathons in Pune</a>.</p>
<h3>Mumbai</h3>
<p>Events in Mumbai are spread across the city, the suburbs, Navi Mumbai and Thane, so travel time matters more than distance on a map. College fests, fintech-flavoured events and startup community meetups are common. See <a href="/cities/mumbai">hackathons in Mumbai</a>.</p>
<h3>Bengaluru</h3>
<p>With a dense startup and developer community, Bengaluru tends to have company-hosted and community-run events alongside college hackathons, and many of them are open to working developers as well as students. See <a href="/cities/bengaluru">hackathons in Bengaluru</a>.</p>
<h3>Delhi NCR</h3>
<p>Large university campuses in Delhi and tech offices in Noida and Gurugram mean a wide spread of events. Check which part of NCR a venue is in before you register, because a cross-city commute can eat into your energy. See <a href="/cities/delhi-ncr">hackathons in Delhi NCR</a>.</p>
<h3>Hyderabad</h3>
<p>Hyderabad’s tech corridor and its many engineering colleges support a steady mix of campus and company events. See <a href="/cities/hyderabad">hackathons in Hyderabad</a>.</p>
<h3>Chennai</h3>
<p>Chennai’s large engineering colleges run tech fests that often include hackathons, and there’s a solid base of companies and developer groups too. See <a href="/cities/chennai">hackathons in Chennai</a>.</p>
<p>Not in one of these cities? The <a href="/cities">cities page</a> also covers places such as Ahmedabad, Kolkata, Jaipur, Chandigarh, Kochi, Indore, Nagpur and Bhubaneswar, and we’re widening coverage over time.</p>
<h2>How do you find local hackathons that aren’t on the big platforms?</h2>
<p>Plenty of good offline events, especially small college ones, are announced only locally. To catch them:</p>
<ol>
<li><strong>Follow college clubs nearby.</strong> Coding clubs, developer student groups and entrepreneurship cells at colleges in your city usually post on Instagram and LinkedIn first.</li>
<li><strong>Watch fest pages.</strong> Tech fests often list a hackathon as one event among many, so it’s easy to miss if you only check hackathon platforms.</li>
<li><strong>Join local developer communities.</strong> City-level Discord, Telegram and WhatsApp groups share events, meetups and team requests.</li>
<li><strong>Ask seniors.</strong> Students who did hackathons last year know which local events are well run and which ones to skip.</li>
<li><strong>Tell others when you find one.</strong> If an event isn’t on HackathonFinder, <a href="/submit">submit it</a>. Every submission makes the list better for students in your city.</li>
</ol>
<h2>How far is too far?</h2>
<p>A free event that costs you two days of travel and a lot of money in tickets and food isn’t really free. Before you register for an offline hackathon outside your city, add up:</p>
<ul>
<li>Return travel for everyone on the team, in ₹, at the fares you’ll actually pay</li>
<li>Food and stay for the nights before and after the event</li>
<li>Classes, practicals or internals you’ll miss</li>
<li>Any travel support or reimbursement the organiser offers, and the conditions attached</li>
</ul>
<p>For a first offline hackathon, something in your own city or a short trip away is usually the best choice. Save the longer trips for events you really care about, such as one with a theme you’ve been building in for months.</p>
<h2>A logistics checklist for offline events</h2>
<ul>
<li>Confirm the exact venue, the reporting time and the entry gate.</li>
<li>Carry your college ID, a charger, an extension board, a water bottle and a hoodie for cold halls.</li>
<li>Check whether food, Wi-Fi and a rest area are provided for overnight events.</li>
<li>Plan how you’ll get home safely if the event finishes late, and share your plan with family or friends.</li>
<li>Get written permission from your college if the event overlaps with classes.</li>
</ul>
<p>Our <a href="/blog/checklist-before-you-register">checklist before you register</a> covers eligibility, fees and submission rules in more detail.</p>
<h2>What if there’s nothing near you right now?</h2>
<p>Some weeks the nearby list is thin. In that case, join an online event so you keep building, and save a few offline events further out on the <a href="/calendar">calendar</a> to plan around. You can also look for teammates in your city on the <a href="/teams">Team Finder board</a> so you’re ready when something local opens. And if you’d rather not keep checking, the <a href="/digest">weekly digest</a> sends open hackathons for your cities every Monday.</p>
<h2>Frequently asked questions</h2>
<h3>How do I find hackathons near me?</h3>
<p>Open the Hackathons near me page on HackathonFinder and share your location or pick your city. In-person events are shown nearest first, followed by online events you can join from anywhere. You can also browse city pages and add filters for theme, deadline and team size.</p>
<h3>Which Indian cities have the most offline hackathons?</h3>
<p>Cities with many engineering colleges and tech companies, such as Bengaluru, Pune, Hyderabad, Mumbai, Delhi NCR and Chennai, tend to see regular in-person events. The mix changes through the year, so check current listings rather than relying on reputation.</p>
<h3>Are offline hackathons free?</h3>
<p>Many are free to enter, and some include food and a place to rest during overnight events. Others charge a registration fee. Travel is usually your own cost unless the organiser offers travel support, so read the logistics section before you register.</p>
<h3>Can I join an offline hackathon in another city?</h3>
<p>Usually yes, unless eligibility is limited to one college, city or state. Budget for travel, food and stay, check whether travel is reimbursed, and get permission from your college if the event overlaps with classes.</p>`,
  },
  {
    slug: 'free-online-hackathons-for-beginners',
    title: 'Free online hackathons for beginners: where to start',
    excerpt:
      'A practical guide to free online hackathons for beginners and first-year students: where to find them, what prizes look like and what to build first.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '24 Oct 2026',
    readMinutes: 6,
    theme: 'web-dev',
    keywords: [
      'online hackathons for beginners',
      'free online hackathons',
      'free hackathons with prizes',
      'hackathons for first year students',
      'beginner friendly hackathons',
      'no-code hackathons',
      'virtual hackathons India',
      'first hackathon tips',
    ],
    faqs: [
      {
        q: 'Can a complete beginner join a hackathon?',
        a: 'Yes. Many online hackathons welcome beginners and some have dedicated beginner tracks, workshops and mentors. You don’t need to be an expert coder; you need to be willing to learn quickly, finish a small project and explain it clearly.',
      },
      {
        q: 'Are free online hackathons worth it if I might not win?',
        a: 'Usually yes. Even without a prize you finish a real project, learn tools under time pressure and get something concrete for your resume and GitHub. Treat your first one as practice and aim to finish rather than win.',
      },
      {
        q: 'Can first-year students take part in hackathons?',
        a: 'Most open hackathons accept students from any year, though a few limit eligibility by year or branch. First-years often do well by teaming up with a senior or joining events that offer workshops and mentors.',
      },
      {
        q: 'Are there hackathons for people who can’t code?',
        a: 'Some events allow no-code or low-code tools, and every team needs people for research, design, the pitch and the demo video. Check the rules on the organiser’s page to see which tools are allowed.',
      },
    ],
    contentHtml: `<p>Free online hackathons for beginners are the easiest way into the hackathon world: no travel, no entry fee and usually a longer build window than an overnight campus event. If you’re a first-year student, someone who has only just learned a bit of Python or JavaScript, or a designer who has never been to a hackathon, this guide explains where to find beginner-friendly events, what prizes in free hackathons usually look like, how no-code participants can contribute and a weekend plan for your first attempt.</p>
<h2>Can a complete beginner join a hackathon?</h2>
<p>Yes, and many organisers actively want you there. Hackathons aren’t exams. Nobody checks your CGPA or asks you to solve graph problems on a whiteboard. What matters is whether your team picks a sensible problem, builds a small thing that works and explains it well. A beginner who finishes a simple, useful project often learns more in one weekend than in a month of tutorials.</p>
<p>The trick is choosing the right event for a first attempt, rather than the biggest or most competitive one you can find.</p>
<h2>What makes an online hackathon beginner-friendly?</h2>
<p>Look for these signs on the event page:</p>
<ul>
<li><strong>Open eligibility.</strong> All years and branches welcome, with no minimum experience.</li>
<li><strong>A beginner track or prize.</strong> Some events judge first-timers separately, which levels the field.</li>
<li><strong>Workshops and mentors.</strong> Sessions on getting started, plus mentors you can message during the build.</li>
<li><strong>A longer build window.</strong> A few days or a week is easier than 24 hours straight when you’re still learning.</li>
<li><strong>Flexible team size.</strong> Events that allow solo entries or small teams make it easier to start.</li>
<li><strong>Clear judging criteria.</strong> When the rubric is public, you know what to aim for.</li>
<li><strong>No entry fee.</strong> There’s no reason to pay for your first one.</li>
</ul>
<h2>Where do you find free online hackathons with prizes?</h2>
<p>On <a href="/hackathons">HackathonFinder</a>, set the mode to online and the fee filter to free, then sort by deadline. Add a theme if you have a favourite area. You’ll see events gathered from platforms such as Unstop, Devfolio, Devpost, MLH and HackerEarth, along with college and community events that are only announced on their own pages or social media.</p>
<p>A few habits help beginners in particular:</p>
<ul>
<li>Use the <a href="/calendar">calendar</a> to avoid weekends with internals or assignment deadlines.</li>
<li>Read the rules page before registering. Our <a href="/blog/checklist-before-you-register">checklist before you register</a> takes five minutes.</li>
<li>Subscribe to the <a href="/digest">weekly digest</a> so new beginner-friendly events reach you on Monday instead of after the deadline.</li>
</ul>
<h2>What do prizes in free hackathons usually look like?</h2>
<p>Prize structures vary a lot, so read each event’s page rather than assuming. Common patterns include:</p>
<ul>
<li><strong>Cash prizes in ₹</strong> for the top few teams, sometimes split across several tracks.</li>
<li><strong>Track or sponsor prizes</strong> for the best use of a particular tool, API or theme.</li>
<li><strong>Credits and subscriptions</strong> for cloud services, APIs or developer tools.</li>
<li><strong>Swag</strong> such as T-shirts and stickers, more common at larger events.</li>
<li><strong>Certificates</strong> for participants or finalists.</li>
<li><strong>Interview or internship opportunities</strong> at some company-run events, though these are never guaranteed.</li>
</ul>
<p>Check when and how prizes are paid, and whether the organiser needs bank or tax details from winners. If a “free” hackathon asks for money before you can claim a prize, treat that as a red flag.</p>
<h2>Hackathons for first-year students: what should you know?</h2>
<p>First-years often hold back because they think they need more knowledge first. In practice, you need less than you think:</p>
<ul>
<li><strong>Basics are enough.</strong> HTML, CSS and a little JavaScript, or Python with one simple library, can power a good weekend project.</li>
<li><strong>Templates are your friend.</strong> Most events let you use open-source libraries and starter templates. Check whether pre-written code is allowed, and keep it to setup rather than the project itself.</li>
<li><strong>Team up across years.</strong> A second- or third-year teammate can help with setup and deployment while you learn. Post on the <a href="/teams">Team Finder board</a> saying you’re a first-year keen to learn; plenty of people are happy to have an enthusiastic beginner on board.</li>
<li><strong>Ask mentors early.</strong> Mentors expect beginner questions. Asking in hour two is far better than being stuck in hour twenty.</li>
</ul>
<h2>Can you join a hackathon without coding?</h2>
<p>Often, yes. Some events explicitly allow no-code or low-code tools, and ideathons focus on the idea and the pitch rather than the build. Even in coding hackathons, every team needs people who can:</p>
<ul>
<li>Research the problem and talk to a few real users</li>
<li>Design clickable screens in a prototyping tool</li>
<li>Write the pitch, build the deck and record the demo video</li>
<li>Test the product and keep track of what’s left to do</li>
</ul>
<p>If you’re using a no-code app builder, a form tool or a spreadsheet as your backend, check the rules first, then be upfront about it in your pitch. Judges care about whether it solves the problem.</p>
<h2>A simple weekend plan for your first online hackathon</h2>
<h3>Before it starts</h3>
<p>Set up your accounts, make sure everyone can push to a shared repo and agree on fixed working hours. Pick a chat channel and keep one voice call open while you work.</p>
<h3>Day one</h3>
<p>Spend the first hour on the problem, not the code. Write one sentence describing who you’re helping and why. Then decide the single flow you’ll demo and build only that. By the end of the day, aim for something that works end to end, even if it looks rough.</p>
<h3>Day two</h3>
<p>Fix bugs, improve the main screen and stop adding features by mid-afternoon. Record a short demo video, write a clear README and submit at least an hour before the deadline. Our guide on <a href="/blog/pitch-your-project-in-three-minutes">pitching in three minutes</a> helps if there’s a live round.</p>
<h2>Small project ideas that fit a weekend</h2>
<ul>
<li>A tracker that shows which college labs or library seats are free right now</li>
<li>A shared expense splitter for hostel groceries, with amounts in ₹</li>
<li>A study timetable builder that works around internals and practicals</li>
<li>A simple form that helps a local shop take pre-orders</li>
<li>A quiz app that turns your class notes into practice questions</li>
</ul>
<p>Each one solves a clear problem, can be demoed in a minute and leaves room to grow.</p>
<h2>Mistakes beginners commonly make</h2>
<ul>
<li>Picking an idea too big to finish, such as a full social network in a weekend</li>
<li>Spending hours choosing a tech stack instead of building</li>
<li>Leaving the demo video and submission to the last ten minutes</li>
<li>Giving up after a bad first event instead of signing up for the next one</li>
</ul>
<p>When it’s over, write down what you’d do differently and pick your next event. For the next step, read <a href="/blog/how-to-win-your-first-hackathon">how to win your first hackathon</a>.</p>
<h2>Frequently asked questions</h2>
<h3>Can a complete beginner join a hackathon?</h3>
<p>Yes. Many online hackathons welcome beginners and some have dedicated beginner tracks, workshops and mentors. You don’t need to be an expert coder; you need to be willing to learn quickly, finish a small project and explain it clearly.</p>
<h3>Are free online hackathons worth it if I might not win?</h3>
<p>Usually yes. Even without a prize you finish a real project, learn tools under time pressure and get something concrete for your resume and GitHub. Treat your first one as practice and aim to finish rather than win.</p>
<h3>Can first-year students take part in hackathons?</h3>
<p>Most open hackathons accept students from any year, though a few limit eligibility by year or branch. First-years often do well by teaming up with a senior or joining events that offer workshops and mentors.</p>
<h3>Are there hackathons for people who can’t code?</h3>
<p>Some events allow no-code or low-code tools, and every team needs people for research, design, the pitch and the demo video. Check the rules on the organiser’s page to see which tools are allowed.</p>`,
  },
  {
    slug: 'ai-ml-hackathons-india',
    title: 'AI hackathons in India: how to find and win GenAI events',
    excerpt:
      'Where to find AI hackathons in India, what machine learning and GenAI hackathons usually ask for, and what judges look for in an AI project.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '23 Oct 2026',
    readMinutes: 6,
    theme: 'ai-ml',
    keywords: [
      'AI hackathons in India',
      'GenAI hackathons',
      'machine learning hackathons India',
      'ML hackathons for students',
      'LLM hackathon project ideas',
      'AI hackathon judging criteria',
      'data science hackathons India',
      'generative AI hackathon',
    ],
    faqs: [
      {
        q: 'Where can I find AI hackathons in India?',
        a: 'Filter by the AI / ML theme on HackathonFinder to see machine learning and GenAI hackathons from platforms such as Unstop, Devfolio, Devpost, MLH, HackerEarth, Kaggle and lablab.ai, plus college and company events. Combine the theme with city, online or offline and deadline filters.',
      },
      {
        q: 'Do I need to train my own model for an AI hackathon?',
        a: 'Usually not. Most GenAI hackathons expect you to build on existing models through APIs or open-weight models. What matters is the problem you solve, how well the product works and whether you can show evidence that it works. Data science challenges are different and are scored on model performance.',
      },
      {
        q: 'What do judges look for in an AI hackathon project?',
        a: 'A real problem where AI is genuinely needed, a working demo with realistic inputs, some evidence that the output is reliable, honest handling of failure cases and user data, and a clear explanation of what the model does versus what your team built.',
      },
      {
        q: 'What skills should I learn before an AI hackathon?',
        a: 'Basic Python, calling a model API, simple prompt design, a quick way to build a user interface and how to deploy a small app. Knowing how to retrieve information from your own documents and how to test outputs on a small set of examples also helps a lot.',
      },
    ],
    contentHtml: `<p>AI hackathons in India have grown from a niche track into one of the most common themes on the calendar. Colleges, startups, large tech companies and developer communities now run machine learning and GenAI hackathons throughout the year, both online and in person. That’s good news if you enjoy building with models, but it also means judges have seen a great many chatbots. This guide covers the kinds of AI hackathons you’ll come across, where to find them, what judges tend to look for in an AI project and how to scope something you can finish in a weekend.</p>
<h2>What kinds of AI hackathons run in India?</h2>
<p>“AI hackathon” covers several quite different formats. Knowing which one you’re entering changes how you prepare.</p>
<h3>GenAI and LLM application hackathons</h3>
<p>The most common format right now. You build an app on top of a large language model or another generative model, often through an API or an open-weight model. Judging focuses on usefulness, the demo and execution, not on model accuracy scores.</p>
<h3>Data science and ML challenges</h3>
<p>You get a dataset and a metric, and teams compete on a leaderboard, sometimes followed by a presentation round. Platforms such as Kaggle and some company challenges on HackerEarth and Unstop follow this pattern. Feature engineering, validation and model choice matter most here.</p>
<h3>Domain AI hackathons</h3>
<p>Healthtech, agriculture, fintech, climate and education events increasingly have AI tracks. Domain understanding often carries as much weight as the model, so a teammate who knows the field is valuable.</p>
<h3>Computer vision and edge AI</h3>
<p>Some events, especially those with an IoT or hardware angle, ask for models that run on cameras, phones or small devices. Here, speed and working on limited hardware matter as much as accuracy.</p>
<h3>Agent hackathons</h3>
<p>A newer format where you build systems that plan and take actions using tools. These reward reliable, well-scoped behaviour far more than impressive-sounding autonomy.</p>
<h2>Where do you find AI and machine learning hackathons in India?</h2>
<p>The quickest route is the <a href="/themes/ai-ml">AI / ML theme page</a> on HackathonFinder, which gathers AI, machine learning and GenAI events from platforms such as Unstop, Devfolio, Devpost, MLH, HackerEarth, Kaggle and lablab.ai, along with college and company events. From there:</p>
<ul>
<li>Combine the theme with online or offline, your city and a deadline range on the <a href="/hackathons">hackathons page</a>.</li>
<li>Check <a href="/near-me">hackathons near me</a> if you want an in-person AI event you can reach easily.</li>
<li>Keep an eye on company-sponsored events. Many are designed to get developers using a particular model, API or cloud platform, and they often come with credits.</li>
</ul>
<h2>What do judges look for in an AI project?</h2>
<p>Judging criteria differ, so read the rubric for each event. Across most GenAI and applied ML hackathons, though, the same themes come up again and again.</p>
<h3>A real problem where AI is actually needed</h3>
<p>“A chatbot for X” is the most common AI hackathon idea, and judges know it. Start with a specific user and a specific pain, then explain why a model is the right tool. If a simple form or a lookup table would solve the problem, judges will notice.</p>
<h3>A working demo with realistic inputs</h3>
<p>Show the product handling the kind of messy, real input a user would give: a blurry photo, a voice note in Hinglish, a long PDF. A demo that only works on one hand-picked example doesn’t convince anyone.</p>
<h3>Evidence that it works</h3>
<p>This is where many teams fall short. Even a small test set of twenty or thirty examples, with a simple count of how many the system got right, sets you apart. Show one or two failure cases too and explain what you’d do about them. Honesty about limits earns more trust than claiming perfection.</p>
<h3>Clarity about what you built</h3>
<p>Be clear about which parts come from the model and which parts your team designed: the data pipeline, the prompts, the retrieval, the checks, the interface. Judges want to see your thinking, not just the model provider’s.</p>
<h3>Responsible handling of data</h3>
<p>If your project touches health, money, identity or children, say how you handle personal data and what happens when the model is wrong. A sentence on safeguards, such as human review for risky outputs, shows maturity.</p>
<h3>Cost and speed awareness</h3>
<p>You don’t need a business plan, but knowing roughly how slow or expensive each request is, and how you’d reduce that, makes the project feel real.</p>
<h2>How do you scope a GenAI project for a weekend?</h2>
<ol>
<li><strong>Pick one task the model does.</strong> Summarise, extract, classify, answer from documents or generate. One task done well beats five done badly.</li>
<li><strong>Get the data flowing first.</strong> Before polishing prompts, make sure inputs reach the model and outputs reach the screen.</li>
<li><strong>Build a tiny evaluation set early.</strong> Collect example inputs and the answers you expect, and re-run them whenever you change a prompt.</li>
<li><strong>Use a quick interface.</strong> A simple web page or a lightweight Python UI library is enough. Don’t spend hours on styling.</li>
<li><strong>Freeze features before the end.</strong> In the last few hours, stop changing prompts and models. Late changes break demos.</li>
</ol>
<p>Our guide to <a href="/blog/pitch-your-project-in-three-minutes">pitching in three minutes</a> explains how to put the demo at the centre of your presentation.</p>
<h2>Skills worth preparing</h2>
<ul>
<li>Python basics, including reading files and calling web APIs</li>
<li>Calling at least one model API and handling errors and rate limits</li>
<li>Basic prompt design: clear instructions, examples and structured output</li>
<li>Retrieving information from your own documents to ground the model’s answers</li>
<li>Deploying a small app so judges can try it from a link</li>
</ul>
<h2>Credits, keys and rules</h2>
<p>Many AI events offer API or cloud credits, and most providers have free tiers that are enough for a hackathon demo. Never commit API keys to a public repo; use environment variables and rotate a key straight away if it leaks. Read the rules on pre-trained models, open-source code and AI coding assistants, since some events restrict them. And if you need a teammate with ML or domain experience, post on the <a href="/teams">Team Finder board</a>.</p>
<p>For inspiration, read how other students approached their projects in <a href="/wins">winning stories</a>, then check what’s open on the <a href="/themes/ai-ml">AI / ML theme page</a>.</p>
<h2>Frequently asked questions</h2>
<h3>Where can I find AI hackathons in India?</h3>
<p>Filter by the AI / ML theme on HackathonFinder to see machine learning and GenAI hackathons from platforms such as Unstop, Devfolio, Devpost, MLH, HackerEarth, Kaggle and lablab.ai, plus college and company events. Combine the theme with city, online or offline and deadline filters.</p>
<h3>Do I need to train my own model for an AI hackathon?</h3>
<p>Usually not. Most GenAI hackathons expect you to build on existing models through APIs or open-weight models. What matters is the problem you solve, how well the product works and whether you can show evidence that it works. Data science challenges are different and are scored on model performance.</p>
<h3>What do judges look for in an AI hackathon project?</h3>
<p>A real problem where AI is genuinely needed, a working demo with realistic inputs, some evidence that the output is reliable, honest handling of failure cases and user data, and a clear explanation of what the model does versus what your team built.</p>
<h3>What skills should I learn before an AI hackathon?</h3>
<p>Basic Python, calling a model API, simple prompt design, a quick way to build a user interface and how to deploy a small app. Knowing how to retrieve information from your own documents and how to test outputs on a small set of examples also helps a lot.</p>`,
  },
  {
    slug: 'hackathon-resume-and-internships',
    title: 'Do hackathons help get internships? Resume and LinkedIn tips',
    excerpt:
      'Do hackathons help you get internships and placements? How to put hackathons on your resume and LinkedIn, and build a profile recruiters can check.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '21 Oct 2026',
    readMinutes: 6,
    theme: 'edtech',
    keywords: [
      'do hackathons help get internships',
      'hackathons for placements',
      'how to put hackathons on resume',
      'hackathon on LinkedIn',
      'hackathon resume example',
      'hackathon experience for internships',
      'student portfolio projects India',
      'hackathon certificate value',
    ],
    faqs: [
      {
        q: 'Do hackathons help get internships?',
        a: 'They can. A finished hackathon project gives you proof of work, strong talking points for interviews and contacts with mentors and companies. Some company-run hackathons are linked to interviews. They help most when you can show and explain what you personally built, not just list participation.',
      },
      {
        q: 'Should I put a hackathon on my resume if I didn’t win?',
        a: 'Yes, if you finished a project you can explain. Put it under Projects with what you built, your role and the tools you used. A clear, working project matters more to most interviewers than the result.',
      },
      {
        q: 'Where do hackathons go on a resume?',
        a: 'Put the project under Projects, written like any other project, and mention the hackathon as context. Wins, finalist places and track prizes can also go under Achievements. Keep each entry to two or three lines.',
      },
      {
        q: 'Are hackathon participation certificates useful?',
        a: 'On their own, not very. A list of participation certificates says little. One or two well-explained projects with a repo and a demo link say far more. Keep certificates as backup, not as the main evidence.',
      },
    ],
    contentHtml: `<p>Do hackathons help get internships and placements? Honestly, they can, but not automatically. A line that says “participated in 12 hackathons” does little on its own. A hackathon project you can demo, explain and defend in an interview is one of the strongest things a student without work experience can put on a resume. This guide explains how hackathons help with internships, how to put hackathons on your resume and LinkedIn, and how to build a public profile that makes the work easy for recruiters to check.</p>
<h2>How do hackathons help with internships and placements?</h2>
<p>Hackathons give you a few things that are hard to get any other way while you’re still in college:</p>
<ul>
<li><strong>Proof of work.</strong> A repo, a demo link and a short video show what you can build, not just what courses you took.</li>
<li><strong>Interview stories.</strong> “Tell me about a time you worked under pressure” or “describe a technical problem you solved” are much easier to answer with a real hackathon behind you.</li>
<li><strong>Teamwork evidence.</strong> You worked with people you may have just met, split roles and shipped something together. That’s close to how real teams work.</li>
<li><strong>Contacts.</strong> Mentors, judges, sponsors and other participants are people working in the field. A good conversation at an offline event can lead to a referral later.</li>
<li><strong>Direct routes.</strong> Some company-run hackathons are explicitly linked to interviews or internship offers for top teams. These are never guaranteed, so read the event page to see what’s actually promised.</li>
</ul>
<p>What hackathons don’t do is replace the basics. For many placement processes you’ll still face aptitude tests and coding rounds. Hackathon projects help most once you reach the interview, where they give you something real to talk about.</p>
<h2>How do you put hackathons on your resume?</h2>
<h3>Where it goes</h3>
<p>Put the project under <strong>Projects</strong>, written like any other project, and mention the hackathon as context. If you won, placed as a finalist or took a track prize, add a one-line entry under <strong>Achievements</strong> as well. Don’t create a separate “Hackathons” section listing every event you’ve attended.</p>
<h3>A simple formula</h3>
<p>For each project, aim for two or three lines that cover:</p>
<ol>
<li><strong>What it does and for whom.</strong> One plain sentence.</li>
<li><strong>What you personally did.</strong> Your role and the parts you built.</li>
<li><strong>The tools.</strong> Only the important ones.</li>
<li><strong>The result.</strong> A placing, a measurable outcome from testing, or simply that it was demoed live.</li>
</ol>
<h3>An example entry</h3>
<blockquote>Clinic queue tracker, built at a 36-hour college hackathon. Lets patients at small clinics see their place in the queue on their phone. I built the React frontend and the Firebase real-time backend; demoed live to judges and shortlisted for the final round. Repo and demo video linked.</blockquote>
<p>That entry is short, specific and honest about the individual contribution. Swap in your own project, role and result; never inflate a placing or claim parts a teammate built.</p>
<h3>What if you didn’t win?</h3>
<p>Include it anyway, as long as you finished something you can explain. Most interviewers care more about what you built and how you think than about the prize. A non-winning project with a clean README and a working demo link is far more useful than a winning one you can’t talk about.</p>
<h2>How do you add hackathons to LinkedIn?</h2>
<ul>
<li><strong>Projects section.</strong> Add each project with a short description, the tools, your teammates and links to the repo and demo.</li>
<li><strong>Honors and awards.</strong> Add wins, finalist places and track prizes with the organiser’s name.</li>
<li><strong>A post after the event.</strong> Share what you built, one thing you learned and a short demo clip. Tag your teammates and thank the organisers and mentors. Keep it about the work, not just the certificate.</li>
<li><strong>Featured section.</strong> Pin your best project or demo video so it’s the first thing a visitor sees.</li>
</ul>
<h2>Why build a public hackathon profile?</h2>
<p>Recruiters and seniors are more likely to look at your work if it’s all in one place. Your <a href="/profile">HackathonFinder profile</a> brings together your hackathon record, results, badges and an activity heatmap, a bit like the coding profiles students already share. It has a public page you can link from your resume and LinkedIn, so anyone can see what you’ve taken part in and how you did.</p>
<p>If you won or placed, write it up in <a href="/wins">winning stories</a>: the problem, what you built, what the judges liked and what you’d tell someone before their next hackathon. A write-up like that shows you can explain your work, which is exactly what interviews test. It also helps other students, which is a nice side effect.</p>
<h2>Make your repo interview-ready</h2>
<p>Many interviewers click the GitHub link. Before you put a project on your resume, spend an hour on the repo:</p>
<ul>
<li>A README with one paragraph on the problem, screenshots, setup steps and a demo link</li>
<li>A short section listing who did what, with teammates credited</li>
<li>No API keys, passwords or personal data committed anywhere in the history</li>
<li>A note on what you’d build next or what you’d change</li>
</ul>
<h2>How do you talk about a hackathon in an interview?</h2>
<p>Use a simple structure: the situation, the problem you chose and why, what you personally built, one hard decision or bug and how you handled it, and the result. Practise it so you can tell it in about two minutes. Be ready for follow-up questions like “why that database?” or “what would break first with a thousand users?”</p>
<h2>Mistakes to avoid</h2>
<ul>
<li>Listing many participation certificates with no projects behind them</li>
<li>Claiming the whole project when you built one part</li>
<li>Broken demo links or private repos on your resume</li>
<li>Using jargon in the description instead of saying what the product does</li>
</ul>
<h2>Where to go from here</h2>
<p>If you don’t yet have a project worth showing, pick an upcoming event on <a href="/hackathons">HackathonFinder</a> with a theme close to the internships you want, find teammates on the <a href="/teams">Team Finder board</a> and aim to finish something you’re proud to explain. Our guide on <a href="/blog/how-to-win-your-first-hackathon">how to win your first hackathon</a> covers the event itself.</p>
<h2>Frequently asked questions</h2>
<h3>Do hackathons help get internships?</h3>
<p>They can. A finished hackathon project gives you proof of work, strong talking points for interviews and contacts with mentors and companies. Some company-run hackathons are linked to interviews. They help most when you can show and explain what you personally built, not just list participation.</p>
<h3>Should I put a hackathon on my resume if I didn’t win?</h3>
<p>Yes, if you finished a project you can explain. Put it under Projects with what you built, your role and the tools you used. A clear, working project matters more to most interviewers than the result.</p>
<h3>Where do hackathons go on a resume?</h3>
<p>Put the project under Projects, written like any other project, and mention the hackathon as context. Wins, finalist places and track prizes can also go under Achievements. Keep each entry to two or three lines.</p>
<h3>Are hackathon participation certificates useful?</h3>
<p>On their own, not very. A list of participation certificates says little. One or two well-explained projects with a repo and a demo link say far more. Keep certificates as backup, not as the main evidence.</p>`,
  },
  {
    slug: 'what-is-a-hackathon',
    title: 'What is a hackathon? How hackathons work, explained',
    excerpt:
      'What is a hackathon? A plain explanation of how hackathons work, the main types, the usual rounds and the terms you’ll hear, for students in India.',
    category: 'Guides',
    author: 'HackathonFinder Team',
    date: '19 Oct 2026',
    readMinutes: 6,
    theme: 'open-innovation',
    keywords: [
      'what is a hackathon',
      'hackathon meaning',
      'how do hackathons work',
      'types of hackathons',
      'hackathon for students',
      'what is an MVP in a hackathon',
      'hackathon PPT round',
      'hackathon problem statement',
    ],
    faqs: [
      {
        q: 'What is a hackathon?',
        a: 'A hackathon is an event where small teams build a working prototype of a software or hardware idea in a fixed time, often 24 to 48 hours, and then demo it to judges. Teams are judged on the problem they chose, what they built and how well they explain it.',
      },
      {
        q: 'Is a hackathon only for coders?',
        a: 'No. Coding is usually central, but teams also need people for design, research, domain knowledge and the pitch. Some events, such as ideathons, focus on ideas and presentations rather than code.',
      },
      {
        q: 'How long does a hackathon last?',
        a: 'Many in-person hackathons run for 24 to 48 hours. Online hackathons can run for several days or weeks. Multi-round events may have an online idea round first and a shorter build round later.',
      },
      {
        q: 'Do hackathons cost money?',
        a: 'Many are free to enter. Some charge a registration fee, and offline events may involve your own travel and food costs unless the organiser covers them. Always check the official event page.',
      },
      {
        q: 'What is the PPT round in a hackathon?',
        a: 'It is a screening round, often called round 1 or the idea round, where teams submit a short slide deck explaining their problem, solution and approach. Organisers use it to shortlist teams for the build round or finale.',
      },
    ],
    contentHtml: `<p>A hackathon is an event where small teams, usually of two to four people, build a working prototype of a software or hardware idea in a fixed time, often 24 to 48 hours, and then demo it to judges. Teams are judged on the problem they chose, what they built and how well they explain it.</p>
<p>The word comes from “hack”, in the sense of building something clever quickly, and “marathon”. Hackathons are run by colleges, companies, communities and governments, and in India they’ve become one of the most popular ways for students to learn, build a portfolio and meet people in tech. If you’re wondering how hackathons work, what the different types are and what terms like MVP or PPT round mean, this guide explains it all in plain language.</p>
<h2>How do hackathons work?</h2>
<p>Formats vary, but most hackathons follow a similar path from announcement to results.</p>
<h3>1. Announcement and registration</h3>
<p>The organiser publishes the theme, dates, eligibility, team size, prizes and rules, then opens registration. In India this often happens on platforms such as Unstop, Devfolio, Devpost, MLH and HackerEarth, or on a college fest site.</p>
<h3>2. Team formation</h3>
<p>You register alone or as a team. Many events have team size limits, often somewhere between two and five people, and some help solo participants find teammates.</p>
<h3>3. Round 1: the idea or PPT round</h3>
<p>Larger events, especially in India, often start with a screening round. Teams submit a short deck or form describing the problem they’ll tackle and how. Organisers shortlist the strongest ideas.</p>
<h3>4. The build</h3>
<p>Shortlisted teams build their project, either online over several days or in person over a day or two. Mentors are usually available to help.</p>
<h3>5. Submission, demo and judging</h3>
<p>Teams submit their code, a demo video, a deck or all three, then present to judges. Judges score projects against published criteria such as problem relevance, technical execution, design, impact and presentation.</p>
<h3>6. Results and prizes</h3>
<p>Winners are announced, sometimes with separate track or sponsor prizes. Prizes can include cash in ₹, credits, swag, certificates and, at some company events, interview opportunities.</p>
<h2>What happens at a hackathon finale?</h2>
<p>The finale is the final round, usually held in person for larger events. Teams arrive, set up, build or polish their project for a fixed time, then present to a panel. Expect an opening briefing, mentor rounds where experts visit each table, a code freeze when building must stop and a demo session followed by questions from judges. For overnight events, organisers usually provide food and a place to rest, but check the logistics section first.</p>
<h2>What are the types of hackathons?</h2>
<h3>By format</h3>
<ul>
<li><strong>Online:</strong> joined from anywhere, often with longer build windows.</li>
<li><strong>Offline or in-person:</strong> held at a campus or office, often over a day or a weekend.</li>
<li><strong>Hybrid:</strong> online early rounds with an in-person finale, a very common pattern in India.</li>
</ul>
<h3>By theme</h3>
<ul>
<li><strong>Open innovation:</strong> build anything you like.</li>
<li><strong>Themed:</strong> focused on an area such as AI/ML, fintech, healthtech, climate, Web3 or smart cities.</li>
<li><strong>Problem-statement based:</strong> the organiser publishes specific problems and teams choose one.</li>
</ul>
<h3>By organiser</h3>
<ul>
<li><strong>College hackathons:</strong> run by clubs or as part of tech fests.</li>
<li><strong>Company hackathons:</strong> run by startups or larger firms, sometimes to hire or to promote a product.</li>
<li><strong>Government hackathons:</strong> run by public bodies, often with problem statements from ministries or departments.</li>
<li><strong>Community hackathons:</strong> run by developer groups and open-source communities.</li>
</ul>
<h3>Close relatives</h3>
<ul>
<li><strong>Ideathons:</strong> focused on the idea and pitch, with little or no code.</li>
<li><strong>Game jams:</strong> build a game around a theme in a fixed time.</li>
<li><strong>CTFs:</strong> capture-the-flag security competitions where teams solve challenges.</li>
<li><strong>Data science challenges:</strong> teams compete on a dataset and a metric, often with a leaderboard.</li>
</ul>
<h2>Who can take part in a hackathon?</h2>
<p>Most student hackathons are open to anyone currently enrolled in college, from first-years onwards, and many also welcome recent graduates or working professionals. Some are limited to one college, a particular year or a region. The eligibility section of the event page is the final word. Our <a href="/blog/checklist-before-you-register">checklist before you register</a> covers what else to check.</p>
<h2>Do you need to be an expert coder?</h2>
<p>No. Coding is usually central, but teams also need people who can design screens, understand the problem domain, research users and deliver the pitch. Beginners regularly finish good projects by keeping the idea small. See our guide to <a href="/blog/free-online-hackathons-for-beginners">free online hackathons for beginners</a>.</p>
<h2>A hackathon glossary</h2>
<ul>
<li><strong>Problem statement:</strong> the specific challenge set by the organiser that teams must address.</li>
<li><strong>Theme or track:</strong> a broad area, such as healthtech or AI, often with its own prizes.</li>
<li><strong>Round 1, idea round or PPT round:</strong> a screening stage where teams submit a short deck explaining their idea.</li>
<li><strong>Shortlist:</strong> the teams selected to move on to the build round or finale.</li>
<li><strong>MVP:</strong> minimum viable product, the smallest version of your idea that works and shows its value.</li>
<li><strong>Prototype:</strong> an early working model, which can be partly faked as long as the main flow works.</li>
<li><strong>Demo:</strong> a live walkthrough of your project showing it in use.</li>
<li><strong>Pitch:</strong> your short presentation to judges covering problem, solution, demo and impact.</li>
<li><strong>Finale:</strong> the final round, often in person, where shortlisted teams build and present.</li>
<li><strong>Mentor:</strong> an experienced person who helps teams during the event.</li>
<li><strong>Judging criteria:</strong> the published rubric judges use to score projects.</li>
<li><strong>Code freeze:</strong> the moment teams must stop changing code before judging.</li>
<li><strong>Submission:</strong> what you hand in, usually a repo, demo video, deck or hosted link.</li>
<li><strong>Track prize or sponsor prize:</strong> a prize for the best project in a category or using a sponsor’s tool.</li>
<li><strong>Swag:</strong> free merchandise such as T-shirts and stickers.</li>
</ul>
<h2>Is a hackathon worth your time?</h2>
<p>For most students, yes. You learn faster than in most classes, finish a real project for your resume, practise teamwork and presenting, and meet people from other colleges and companies. Winning is a bonus. The time to be careful is when an event clashes with exams or costs more in travel than you can afford, so plan with the <a href="/calendar">calendar</a>. Our guide on <a href="/blog/hackathon-resume-and-internships">hackathons, resumes and internships</a> explains how to make the most of what you build.</p>
<h2>How do you find your first hackathon?</h2>
<p>Browse upcoming events on <a href="/hackathons">HackathonFinder</a>, which gathers listings from platforms, college sites and social media in one place, or use <a href="/near-me">hackathons near me</a> to see in-person events closest to you first. Need teammates? Try the <a href="/teams">Team Finder board</a>. Then read <a href="/blog/how-to-win-your-first-hackathon">how to win your first hackathon</a> before the big day.</p>
<h2>Frequently asked questions</h2>
<h3>What is a hackathon?</h3>
<p>A hackathon is an event where small teams build a working prototype of a software or hardware idea in a fixed time, often 24 to 48 hours, and then demo it to judges. Teams are judged on the problem they chose, what they built and how well they explain it.</p>
<h3>Is a hackathon only for coders?</h3>
<p>No. Coding is usually central, but teams also need people for design, research, domain knowledge and the pitch. Some events, such as ideathons, focus on ideas and presentations rather than code.</p>
<h3>How long does a hackathon last?</h3>
<p>Many in-person hackathons run for 24 to 48 hours. Online hackathons can run for several days or weeks. Multi-round events may have an online idea round first and a shorter build round later.</p>
<h3>Do hackathons cost money?</h3>
<p>Many are free to enter. Some charge a registration fee, and offline events may involve your own travel and food costs unless the organiser covers them. Always check the official event page.</p>
<h3>What is the PPT round in a hackathon?</h3>
<p>It is a screening round, often called round 1 or the idea round, where teams submit a short slide deck explaining their problem, solution and approach. Organisers use it to shortlist teams for the build round or finale.</p>`,
  },
];
