# HackathonFinder: Product Brief

> **Status:** Planning · **Last updated:** 21 Oct 2026
> **Source:** Yash's discussion with sir (incubation mentor) on 20 Oct 2026
> **Confidential:** Sir asked that the idea not be shared widely. Keep this repo private.

---

## 1. What it is

HackathonFinder is an **agent-powered content system**. AI agents find news and topics, research them, write in a fixed house style, check quality, format for SEO, schedule posts, and publish to the website and LinkedIn with very little manual work.

Its first deployment is **The Executive Narrative (TEN)** at [theexecutivenarrative.com](https://theexecutivenarrative.com), the company sir already runs. TEN is the B2B showcase, branded "powered by LayerFlow".

### How the products relate

| Product | Owner | Model | Role |
|---|---|---|---|
| **LayerFlow** | Yash | B2C | Yash's existing product. Stays B2C and keeps running on its own. |
| **TEN** | Sir | B2B content platform | First client and live showcase for the agents |
| **HackathonFinder** | Yash, with sir | Agent system | This repo: the agents, pipeline, and frontend |

---

## 2. Who it's for

TEN's readers are **C-level executives, VPs and directors at Fortune 500 companies**.

- **Goal:** Save them time and give them real insight.
- **Not wanted:** Generic content. Sir said overused case studies (Microsoft, Google) waste his readers' time.
- **Wanted:** Non-obvious angles, such as "Zoho is a bootstrapped unicorn", which a US executive likely doesn't know.

---

## 3. Content categories

These categories are already live on the TEN site, with about 168 posts in total.

| Category | URL | Posts | What it contains | Status |
|---|---|---|---|---|
| Brief | `/brief` | 57 | Short news briefs on deals, investments and M&A (for example, Toyota $6.4B and Saudi projects) | In scope |
| Thinking | `/thinking` | 27 | Leadership and strategy essays (for example, "Momentum Can Hide Strategic Drift") | In scope |
| Room | `/room` | 3 | Scenario and decision-room stories (for example, "The Illusion of the War Room") | **Skipped for now.** Sir uploads interviews manually. |
| Playbook | `/playbook` | 21 | How-to frameworks (for example, "Building Resilient Organizations…") | In scope |
| Decisions | `/descisions` ⚠️ | 30 | Decision questions (for example, "Should You Conquer One Market Before Entering Ten?") | In scope |
| Deep Dive | `/deep_dive` | 30 | Company analyses (Nvidia, ServiceNow, Zerodha, Razorpay) | In scope |

> ⚠️ The URL `/descisions` is misspelled. Change it to `/decisions` and add a 301 redirect from the old URL before anyone demos the site.

---

## 4. Agent pipeline

```
News / Topic Finder ─► Research ─► Writer ─► Value Check
                                     ▲            │
                                     └── fail ────┤  (max 2 rewrites)
                                                  │ pass
                                                  ▼
                                          SEO + Formatter ─► Database ─► Scheduler / Queue
                                                                                │
                                                                     ┌──────────┴──────────┐
                                                                     ▼                     ▼
                                                                  Website              LinkedIn
```

| # | Agent | What it does | Output |
|---|---|---|---|
| 1 | **News and topic finder** | Pulls news and topics by category from sources that sir approves. It is selective and doesn't fetch everything. It dedupes and scores results by relevance. | Ranked topic list per category |
| 2 | **Research** | Goes deep on each topic and looks for non-obvious angles, not generic case studies | Research notes with sources |
| 3 | **Writer** | Writes in sir's personal persona, using a fixed paragraph framework for each category (Decisions, Playbook, Thinking, Deep Dive, Brief). Each category must read differently, unlike typical AI writing where every paragraph looks the same. | Draft post |
| 4 | **Value check** | Asks "Does this add value to an executive?" On yes, the post moves on. On no, it goes back to the writer, with a limit of 2 rewrites. | Approved draft or rewrite request |
| 5 | **SEO and formatter** | Formats the post for the site. Researches competitor content and keywords, generates the SEO title, meta tags and slug, and adds internal links between related blogs automatically. | Publish-ready post saved to the DB |
| 6 | **Scheduler and queue** | AI picks the publish date and time and stores it in the DB. A worker publishes when the time comes. | Scheduled queue entries |
| 7 | **Publisher (Web + LinkedIn)** | Shows the post on the website by fetching it from the DB. Reformats the same content for LinkedIn and auto-posts it at the right time. | Live post on the site and on LinkedIn |

### Priority

1. **Must work 100%:** news finder, writer, formatter, SEO, and publishing to the web and LinkedIn
2. **Must be complete:** the frontend, with all categories working and polished
3. **If time allows:** the rest of the agents and deeper quality loops

---

## 5. Frontend

- All five in-scope category pages work with real data from the DB
- Post detail pages are SEO-ready (meta tags, slugs, internal links)
- A **news feed** shows incoming topics and news grouped by category
- An **agent dashboard** shows each agent's status, a run log, and what is queued or scheduled. Sir wants to demo this to clients, so the pipeline has to be visible.
- The admin panel comes later, after the agents work

---

## 6. Scope decisions (from sir)

| Decision | Detail |
|---|---|
| Room is skipped | Sir uploads interviews manually |
| Blog only | No video or media until everything works |
| Admin panel later | Agents first; admin follows on Thursday/Friday (22–23 Oct 2026) |
| Multi-region later | One DB serving many sites (Middle East, North America, India), each with geo-specific content |
| No image generation for now | The VPS can't handle it. Sir will ask the incubation's offline-LLM team. |

---

## 7. Business model

- **LayerFlow** stays B2C.
- **TEN** is the B2B showcase ("powered by LayerFlow").
- Sir sells the agent system to enterprises himself:
  - A **one-time setup fee** plus an **annual renewal**
  - **Per-agent setup pricing** that varies by client
- **Equity and cofounder terms** are on the agenda for Thursday, 22 Oct 2026.

---

## 8. Infrastructure

| Item | Detail |
|---|---|
| Sir's VPS (Hostinger, 2 vCPU) | Yash is added as a user. It can run the orchestrator and API calls but not local LLMs. |
| Isolation | **Do not touch the client's tourism data** on the VPS. Run everything in a separate container. |
| Dedicated machine | Sir is offering an i7 machine at the incubation. A GPU can be added later. |
| LLMs | API models (Claude, GPT, Gemini) |

---

## 9. Technical approach

- **No fine-tuning.** Use API models with strong prompts, few-shot examples and a template for each category. Fine-tuning would use up the 3 days and give worse results.
- **Existing posts are the training data.** Pick the best 3–5 of the existing posts in each category and use them as few-shot examples for the writer.
- **Build LinkedIn output first, the API second.** Auto-posting is the biggest risk:
  - A personal profile needs OAuth with the `w_member_social` scope.
  - A company page needs LinkedIn's approval, which can take days or be rejected.
  - Fallback: generate post-ready LinkedIn text and publish manually or through n8n or Buffer until API access works.
- **Make the pipeline visible.** If the pipeline works but nobody can see it, the client demo won't land.

### Data model (first pass)

| Table | Purpose |
|---|---|
| `sites` | One row per regional site (enables multi-region later) |
| `categories` | Brief, Thinking, Playbook, Decisions, Deep Dive, Room |
| `sources` | News sources and feeds approved by sir |
| `topics` | Topics and news found by the finder, with scores and dedupe keys |
| `posts` | Drafts and published posts, with SEO fields, category and site |
| `queue` | Scheduled publish jobs (web and LinkedIn), with date, time and status |
| `agent_runs` | Every agent run: input, output, status and timing (used by the dashboard) |

---

## 10. Build plan (3 days)

The commitment to sir: **by Thursday, 22 Oct 2026, demo a dummy-data workflow, the news finder, and the basic agents.**

### Day 1: Foundation and news
- Set up the DB schema (section 9)
- Build the news finder: RSS plus a search API, classification by category, dedupe and relevance scoring. Start with Reuters, Bloomberg, Economic Times and TechCrunch until sir sends his source list.
- Get the Brief writer working end to end

### Day 2: Writers and quality
- Build the writer agent with templates for Decisions, Thinking, Playbook and Deep Dive, each with its own persona and paragraph structure
- Add the value-check loop, capped at 2 rewrites
- Build the formatter and SEO agents

### Day 3: Distribution and polish
- Build the scheduler and queue worker
- Build the LinkedIn formatter, and connect the API if approval comes through
- Polish the frontend and the agent dashboard, and prepare the dummy-data demo for Thursday

---

## 11. Inputs needed from sir

- [ ] News sources and the categories to pull for
- [ ] His writing samples and the paragraph framework for each category
- [ ] The v1 Python file, the TEN vision doc and the persona doc
- [ ] LinkedIn: personal profile or company page, and who owns the account
- [ ] VPS user access and container permissions

---

## 12. Open questions

- Is the TEN frontend already live and only needs the agents wired in, or does it need a rebuild? The answer decides whether Day 3 is polish or a scramble.
- How does the HackathonFinder name relate to TEN? Is it this agent system's product name, or a separate product that reuses the same pipeline?
- What equity and cofounder terms will be agreed on Thursday, 22 Oct 2026?
