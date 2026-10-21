# HackathonFinder.in: Product Concept

> **Every hackathon. One place.**
> Status: concept, build in progress · Last updated: 21 Oct 2026

---

## 1. The idea in one line

HackathonFinder.in finds every hackathon on the internet, from Unstop, Devfolio, Instagram, LinkedIn, Google and many other places, and shows them in one searchable list, so students never miss an event that fits them.

---

## 2. The problem

Every platform hosts and lists its own events, and students have to go to each one to register and check details.

- **Hackathons are scattered.** One event is on Unstop, another on Devfolio, another only on a college Instagram page, a LinkedIn post or a WhatsApp group.
- **Students miss deadlines.** By the time they hear about a good hackathon, registration has closed.
- **Searching takes hours.** Checking 10+ platforms and social feeds every week is tiring, so most students only see what their friends share.
- **There's no simple way to filter by need.** Nobody can quickly ask: "Show me free AI hackathons in Pune for second-year students, teams of 2 to 4, closing this month."

---

## 3. The solution

HackathonFinder does the searching for you.

1. **We go everywhere.** Our system checks hackathon platforms, social media, Google search and college websites for new events.
2. **We clean it up.** Each event is turned into one clear card, with dates, deadline, mode, city, team size, prizes, eligibility and themes. If the same event is on three sites, it shows up once.
3. **You find what fits.** Search and filter by what you need, save events, get deadline reminders and register with one click on the organizer's official page.

We don't host events or take registrations. We help students **find** them and send them to the official source to register.

---

## 4. Who it's for

| User | What they want |
|---|---|
| **College students** (main users) | Find hackathons they're eligible for, near them or online, before the deadline |
| **First-time hackers** | Beginner-friendly events, clear rules, teammates |
| **Experienced hackers** | Big prize pools, specific themes (AI, Web3, FinTech), national and global events |
| **Working professionals** | Open-category and company hackathons, weekend and online events |
| **Organizers** (colleges, clubs, companies, communities) | More registrations from the right students |
| **Sponsors and companies** | Reach student developers and find talent |

---

## 5. What we list

Hackathons come first, plus similar events a student might be looking for:

- Hackathons: online, offline and hybrid
- Ideathons and pitch competitions
- Coding contests and challenges
- Case-study and business competitions
- Build and project challenges, where you build something to a brief
- Open-source programs and contribution events
- Company and government innovation challenges

Each listing has a **type**, so users can search for exactly what they need.

---

## 6. Where we find events

| Source | Examples | How we collect |
|---|---|---|
| **Hackathon platforms** | Unstop, Devfolio, Devpost, MLH, HackerEarth, Hack2skill, DoraHacks, lablab.ai, Kaggle | Official APIs, RSS feeds or public listing pages, following each site's terms |
| **Google search** | "hackathon Pune 2026", "AI hackathon students", and similar queries | Web search API, scheduled queries by city, theme and month |
| **Instagram** | College club pages, tech community pages, event posters | Organizer submissions, partner accounts, our browser extension and official APIs where allowed |
| **LinkedIn** | Company and community announcement posts | Same as Instagram: submissions, extension, official APIs where allowed |
| **Event sites** | Luma, Eventbrite, Meetup, Google Developer Groups, Commudle | Public event pages and feeds |
| **College and government sites** | College fest pages, Smart India Hackathon, institute portals | Public pages, watched for changes |
| **Communities** | Discord, Telegram, WhatsApp groups, Reddit, X | User and organizer submissions |
| **People** | Students and organizers | "Submit a hackathon" form and browser extension |

**Browser extension:** while browsing Chrome, Instagram, LinkedIn or any website, a user sees a hackathon and clicks **"Add to HackathonFinder"**. Our system reads that page or poster and turns it into a listing. This covers the places that can't be crawled automatically.

---

## 7. How it works

```
 Sources                    Our system (AI agents)                         Users
 ───────                    ──────────────────────                         ─────
 Platforms  ─┐
 Google     ─┤   1. Scout     → finds new event links and posts
 Instagram  ─┤   2. Extract   → reads the page or poster, pulls out details
 LinkedIn   ─┼─► 3. Dedupe    → merges the same event from different sites   ─► Website
 Event sites─┤   4. Verify    → checks link, dates, deadline, spam           ─► Alerts
 Colleges   ─┤   5. Tag       → themes, eligibility, beginner-friendly       ─► Social posts
 Submissions─┘   6. Publish   → listing page, SEO, alerts, social posts      ─► Weekly digest
```

| Agent | Job |
|---|---|
| **Scout** | Checks every source on a schedule and collects new event links, posts and pages |
| **Extractor** | Reads the page, text or poster image (using OCR) and fills in the event fields |
| **Deduper** | Spots when Unstop, Instagram and a college site describe the same event, and merges them into one listing |
| **Verifier** | Checks the registration link works, the dates make sense and the deadline hasn't passed, and flags fake or spam events |
| **Tagger** | Adds themes, eligibility, difficulty, a "beginner-friendly" label, and paid or free |
| **Writer** | Writes a short, clear summary for each listing, without copying the organizer's full text |
| **Publisher** | Creates the listing page, city and theme pages, social posts and the weekly digest |
| **Alert agent** | Matches new events to users' interests and sends reminders |

Every listing shows **where it came from** and **when it was last checked**.

---

## 8. Features

### 8.1 Find hackathons
- **One list of all hackathons**, with clear cards showing name, organizer, dates, deadline, mode, city, prize and status
- **Search** by name, organizer, theme or keyword
- **Filters:**
  - City (starting with **Pune**), state, country
  - Mode: online, offline, hybrid
  - Dates and registration deadline
  - Status: open, closing soon, in progress, registration closed, completed
  - Team size, solo allowed
  - Prize pool
  - Eligibility: students, year of study, college-only, women-only, professionals
  - Theme: AI/ML, Web3, FinTech, HealthTech, EdTech, Climate, Open Innovation, and others
  - Fee: free or paid
  - Event type: hackathon, ideathon, coding contest, and others
  - Source platform
- **Sort** by deadline, newest, prize or start date
- **Calendar view** of all events by date
- **"Closing soon"** section on the homepage
- **City pages**, for example "Hackathons in Pune", and **theme pages**, for example "AI hackathons"

### 8.2 Smart search ("as per requirement")
Users type what they need in plain words:

> *"Free online AI hackathon for 2nd-year students, team of 3, deadline this month"*

The AI turns that into filters and shows matching events. Users can save it as a **saved search** and get alerts when new matches appear.

### 8.3 Event page
- Summary, dates, registration deadline and event timeline
- Mode, venue and map for offline events
- Team size, eligibility, fee and themes or tracks
- Prizes and perks
- Organizer and sponsors
- **"Register on official site"** button, which links to the source
- **Add to calendar** (Google or Outlook)
- **Share** to WhatsApp, LinkedIn or Instagram
- Source, plus a "last checked" date
- Similar hackathons

### 8.4 For students (with an account)
- **Profile:** college, year, city, skills and interests
- **"For you" recommendations** based on the profile
- **Save** events and get **deadline reminders** by email, push, WhatsApp or Telegram
- **My tracker:** mark events as saved, registered, submitted, or won or participated
- **Hackathon portfolio:** a shareable page of every hackathon you've done, useful for resumes and LinkedIn
- **Weekly digest** of new events that match you

### 8.5 Team finder
- Post "Looking for teammates" on any hackathon
- Find people by skill (frontend, backend, ML, design, pitching)
- Request to join a team and chat about the idea

### 8.6 For organizers
- **Submit a hackathon** for free (form or browser extension)
- **Claim** a listing we found and keep it up to date
- **Featured listings** to reach more students (paid)
- **Analytics:** views, saves and registration clicks
- **Verified organizer** badge

### 8.7 Community and content
- Auto-posts of new hackathons to our **Instagram, LinkedIn and Telegram** channels
- Blog and guides: how to win hackathons, first-hackathon tips, winning project write-ups
- **Results and winners**, where organizers share winners and projects

### 8.8 Trust and safety
- Verified badges for organizers and sources
- "Report this listing" for wrong details, scams or expired events
- Automatic checks for dead links, past deadlines and suspicious fees
- Clear **"paid event"** labels

### 8.9 Admin dashboard
- See every agent run: what was found, merged, verified or rejected
- Review queue for low-confidence listings before they go live
- Edit, merge or remove listings
- Source health, showing which sources are working or failing

---

## 9. Hackathon data (what each listing stores)

| Field | Example |
|---|---|
| Title | "CodeStorm 2026" |
| Type | Hackathon / Ideathon / Coding contest / … |
| Organizer | College, club, company or community |
| Mode | Online / Offline / Hybrid |
| Location | City, state, country, venue |
| Start and end date | 14–15 Nov 2026 |
| Registration deadline | 05 Nov 2026, 23:59 IST |
| Status | Open / Closing soon / In progress / Registration closed / Completed |
| Team size | 2–4, solo allowed: yes or no |
| Eligibility | Students (any year), college-only, professionals, women-only |
| Fee | Free / ₹ amount |
| Prize pool | ₹1,00,000 (stored with currency) |
| Themes and tracks | AI/ML, FinTech, Open Innovation |
| Beginner-friendly | Yes / No |
| Registration link | Official organizer or platform URL |
| Sources | Every place we found it (Unstop, Instagram, …) |
| Last checked | 21 Oct 2026, 10:30 |
| Verified | Yes / No |

---

## 10. Event status (automatic)

| Status | When |
|---|---|
| **Open** | Registration is open |
| **Closing soon** | The deadline is within 3 days |
| **Registration closed** | The deadline has passed but the event hasn't started |
| **In progress** | The event is happening now |
| **Completed** | The event has ended |

---

## 11. Business model

Students use HackathonFinder **for free**. Revenue comes from the organizer side:

| Revenue | How |
|---|---|
| **Featured listings** | Organizers pay to appear at the top of results and city pages |
| **Promotion packages** | Featured in social posts and the weekly digest |
| **Sponsor slots** | Companies sponsor the newsletter or theme pages |
| **College and community partnerships** | Plans for clubs and colleges that run several events a year |
| **Hiring and talent** (later) | Companies reach students who opt in, based on their hackathon portfolio |

---

## 12. Why we're different

| Hosting platforms | HackathonFinder |
|---|---|
| Show only their own events | Shows events from **every** platform and social media |
| Students check each site separately | One search, one list |
| Miss events posted only on Instagram, LinkedIn or college sites | Finds those too, with agents and the browser extension |
| Generic filters | Requirement-based smart search, city pages and personal alerts |

We **don't compete** with the hosting platforms. We send students to them to register.

---

## 13. Data rules

- Follow each website's terms of use and robots.txt. Use official APIs and feeds wherever they exist.
- Only collect **publicly shared** event information.
- Instagram and LinkedIn posts come from **organizer submissions, user submissions, the browser extension, partners and official APIs**, not from scraping accounts.
- **Always link back** to the official source for registration.
- Write our **own short summary** and never copy an organizer's full description or images without permission.
- Organizers can **edit, claim or remove** their listing at any time.
- Student data is used only to personalize alerts. We never sell it.

---

## 14. Tech plan

| Part | Choice |
|---|---|
| Repo | pnpm monorepo |
| Website | `apps/web`, a Next.js (React, TypeScript) site with listings, search, event pages and accounts |
| Agents | `apps/agents`, the discovery workers (scout, extract, dedupe, verify, tag, publish) running on a schedule |
| Shared code | `packages/shared`, the hackathon types, categories and themes, used by both apps |
| Database | PostgreSQL, with tables for hackathons, sources, raw found items, organizers, users, saves, alerts, teams and agent runs |
| AI | API models for extraction, tagging, summaries and smart search, with no fine-tuning needed |
| Search | Database filters first, then a search index once listings grow |
| Notifications | Email first, then push, WhatsApp and Telegram |
| Browser extension | Chrome extension for "Add to HackathonFinder" |

---

## 15. Roadmap

### Phase 1: MVP
- Listings from the main platforms, Google search and manual submissions
- Pune plus online events first
- Homepage, list with search and filters, event pages, calendar view
- "Submit a hackathon" form
- Automatic statuses and "closing soon"
- Admin review queue

### Phase 2: Students come back
- Student accounts, saves and deadline reminders
- Weekly digest email
- Auto-posting to Instagram, LinkedIn and Telegram
- City and theme pages for SEO

### Phase 3: Smarter
- Smart search in plain words, plus saved searches
- "For you" recommendations
- Team finder
- Browser extension
- Organizer claim, analytics and featured listings

### Phase 4: Grow
- All major Indian cities, then global online events
- Hackathon portfolio pages
- Mobile app
- Sponsor and hiring features

---

## 16. How we measure success

- **Coverage:** the share of real hackathons in our cities that we list
- **Freshness:** the time from an event being announced to appearing on HackathonFinder
- **Accuracy:** the share of listings with correct dates and working links
- **Users:** weekly active students, and alert and digest sign-ups
- **Impact:** clicks on "Register on official site"
- **Organizers:** submitted, claimed and featured listings

---

## 17. Open questions

- After Pune, which cities come next?
- Students only at launch, or professionals too?
- Which revenue stream comes first: featured listings or promotion packages?
- Which alert channel comes first after email: WhatsApp or Telegram?
- Who owns what across the team (agents, website, partnerships, social)?

---

## 18. Current build status

- **Done:**
  - pnpm monorepo
  - hackathon data model, themes, cities, sources and auto-status rules in `packages/shared`
  - the full student website in `apps/web` (original design, Tailwind CSS, free Google Fonts):
    - home page with smart search
    - Explore page with every filter, plus city and theme pages
    - event pages (register, save, add to Google Calendar, share)
    - calendar
    - My hackathons tracker
    - Team Finder, community, blog, organizers page, submit form, how it works, privacy and terms
- **Preview only, for now:**
  - listings are sample data
  - saved events and team posts live in the browser
  - submissions and digest sign-ups are not stored yet
- **Next:**
  1. Database and API
  2. First agents (Scout and Extractor) to replace the sample data
  3. Student accounts and email reminders
