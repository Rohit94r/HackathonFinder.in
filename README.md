# HackathonFinder.in

Every hackathon. One place. HackathonFinder finds hackathons from Unstop, Devfolio, Devpost, MLH, Google,
Instagram, LinkedIn, Facebook, college sites and more, and lists them in one searchable place, nearest first.
Live at **[hackathonfinder.in](https://hackathonfinder.in)**. Founded by **Rohit Jadhav**
([LinkedIn](https://www.linkedin.com/in/rohit-jadhav94/) · [GitHub](https://github.com/rohit94r) ·
[Instagram](https://www.instagram.com/dev.by.rohit/) · rjdhav67@gmail.com).
See [concept.md](concept.md) for the full product plan.

## What's in the box

| Part | Path | What it does |
|---|---|---|
| Website + API | `apps/web` | Next.js 14 site and REST API (`src/app/api`): listings, near me, cities, accounts, profiles, community, winning stories, Team Finder, submissions, admin |
| Discovery agents | `apps/agents` | Scout → Extract → Dedupe → Verify → Tag → Publish, every six hours (02:00, 08:00, 14:00 and 20:00 IST) and on "Scrape now". Connectors for Unstop, Devfolio, Devpost, MLH, HackerEarth, lablab.ai, KnowAFest, web search, and Instagram/LinkedIn/Facebook posts (via search or the official Graph API); banners stored on Cloudinary, venues on the map. See [apps/agents/README.md](apps/agents/README.md) |
| Database | `packages/db` | MongoDB models (Mongoose), collections and indexes (`pnpm db:setup`), local MongoDB for development, end-to-end check |
| AI | `packages/ai` | Claude-powered extraction from pages and posters, smart search, plus rule-based fallbacks |
| Shared | `packages/shared` | Types, cities, themes, sources, status rules, distance helpers |

## Run it locally

Needs Node 20.19+ and pnpm 10 (`npx pnpm@10` works if pnpm isn't installed).

```bash
pnpm install
cp .env.example .env      # everything is optional locally
pnpm dev                  # starts a local MongoDB (data in .data/mongo), sets it up, then http://localhost:3000
```

`pnpm dev` starts a real MongoDB on your machine when `MONGODB_URI` is empty and creates every collection
and index. There is no sample data: listings come from the discovery agents (`pnpm agents:run`) and student
submissions. Set `MONGODB_URI` in `.env` to use MongoDB Atlas instead.

Emails (verification, password reset, reminders, digest) are printed in the terminal until `RESEND_API_KEY`
is set, so you can click the links locally. To get the admin dashboard locally, put your email in
`ADMIN_EMAILS` and sign up with it.

## Environment

One `.env` at the repo root serves the website, the agents and the scripts. Every variable is documented in
[.env.example](.env.example).

| Feature | Variables | Without them |
|---|---|---|
| Database | `MONGODB_URI` | `pnpm dev` runs a local MongoDB |
| Sign-in | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (required in production) | Email and password work locally |
| Google / GitHub sign-in | `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_ID/SECRET` | Buttons are hidden |
| Admins | `ADMIN_EMAILS` | Nobody gets the admin role |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | Emails print in the server log |
| AI | `ANTHROPIC_API_KEY`, `AI_MODEL` | Rule-based extraction and smart search |
| Images | `CLOUDINARY_*` | Local uploads in development, links to the source for scraped images |
| Discovery | `GOOGLE_CSE_KEY/CX` or `BRAVE_SEARCH_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Platform and event-site connectors need no keys. Without a search key, web and social search use DuckDuckGo, which often blocks crawlers; without the Instagram token there are no Graph API hashtag posts |
| Discovery schedule | `SCRAPE_SCHEDULER`, `SCRAPE_CATCHUP` | The website scrapes every six hours (02:00, 08:00, 14:00 and 20:00 IST) on a long-running server; `off` turns that off |
| Scheduled jobs | `CRON_SECRET` | Jobs only run in development |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local MongoDB (if needed) + website |
| `pnpm build` / `pnpm start` | Production build and server for the website |
| `pnpm typecheck` | Type-checks every package |
| `pnpm test` | Runs the unit test suites |
| `pnpm test:e2e` | End-to-end check of a running site (`pnpm start` first; `E2E_BASE` to point elsewhere): pages, SEO files, sign-in, permissions, chat, moderation, admin. Creates throwaway accounts and deletes them |
| `pnpm db:setup` | Creates every collection and index in `MONGODB_URI` and removes leftover sample data (safe to re-run) |
| `pnpm db:local` | Just the local MongoDB |
| `pnpm agents:sources --sync` | Registers the discovery sources and shows their health and missing keys |
| `pnpm agents:run` | A full scrape of every enabled source into `MONGODB_URI` (`--source devpost --limit 20` for one, `--dry-run` to only look) |
| `pnpm agents:schedule` | Long-running worker that scrapes every six hours (02:00, 08:00, 14:00 and 20:00 IST) (for hosts without the website) |
| `pnpm agents:repair` | Brings existing scraped listings in line with the current accuracy rules (`--dry-run` to preview) |

## Deploying

- **Website:** any Node host or Vercel (`apps/web`). Set the variables above. `apps/web/vercel.json` schedules
  deadline reminders daily, the weekly digest on Mondays and the discovery scrape every six hours (02:00, 08:00, 14:00 and 20:00 IST)
  (`/api/cron/reminders`, `/api/cron/digest`, `/api/cron/scrape`, authorised with `CRON_SECRET`). On a
  long-running Node server the website runs the scrape timer itself (`src/instrumentation.ts`).
- **Database:** MongoDB Atlas. Run `pnpm db:setup` once against the production database: it creates all
  27 collections and their indexes (also created on first use). Atlas → **Network Access** must allow your host: Vercel functions use
  dynamic egress IPs, so add `0.0.0.0/0` (or Vercel Secure Compute if you have it). Without this every page
  fails with `MongooseServerSelectionError` / `tlsv1 alert internal error`.
- **Agents:** nothing extra when the website runs on a long-running server or on Vercel (see above).
  Otherwise, a small always-on worker (Railway, Render, a VM, …) running `pnpm agents:schedule` with the
  same `.env`. Each slot runs once even if several of these fire.

## Production checklist (hackathonfinder.in)

1. Host env: everything in `.env.example`, with `NEXTAUTH_URL=https://www.hackathonfinder.in`, a fresh
   `NEXTAUTH_SECRET`, `CRON_SECRET`, and `ADMIN_EMAILS` (admins are only granted once their email is verified).
2. Google OAuth redirect URI `https://www.hackathonfinder.in/api/auth/callback/google`; GitHub callback
   `https://www.hackathonfinder.in/api/auth/callback/github`. Resend: verify the `hackathonfinder.in` domain.
3. `pnpm db:setup` once against the production database.
4. Search: add the site in Google Search Console and Bing Webmaster Tools (put their codes in
   `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`) and submit `https://www.hackathonfinder.in/sitemap.xml`.

## SEO

- Per-page titles, descriptions, keywords and canonical URLs (`src/lib/seo.tsx`), Open Graph and Twitter cards,
  generated share images (`opengraph-image.tsx`).
- schema.org JSON-LD: Organization + founder + WebSite search box on every page, Event on each hackathon,
  BlogPosting + FAQPage on guides, BreadcrumbList and ItemList on city and theme hubs, AboutPage on `/about`.
- `sitemap.xml` (pages, cities, themes, guides, every listing, stories, discussions; hourly), `robots.txt`
  (private pages blocked; Google, Bing and AI search crawlers such as GPTBot, PerplexityBot and ClaudeBot
  allowed), `llms.txt` for AI assistants, `manifest.webmanifest`.
- Finished events and personal pages are `noindex`. Guides live in `apps/web/src/data/blogData.ts` and
  `blogSeoPosts.ts`.

## API at a glance

All responses are JSON; errors look like `{ "error": { "code", "message", "fields?" } }`.

| Area | Endpoints |
|---|---|
| Listings | `GET /api/hackathons` (filters, `lat`/`lng`, paging), `GET /api/hackathons/:slug`, `POST /api/hackathons/:slug/report`, `GET /go/:slug` (counts the click, redirects to the organizer) |
| Search | `POST /api/search` (plain English → filters) |
| Accounts | next-auth at `/api/auth/*`, `POST /api/auth/register`, `/api/auth/verify`, `/api/auth/forgot`, `/api/auth/reset` |
| Me | `GET/PATCH /api/me`, `/api/me/saved`, `/api/me/cities`, `/api/me/activity`, `/api/me/notifications`, … |
| Digest | `POST /api/digest`, `GET /api/digest/confirm`, `GET /api/digest/unsubscribe` |
| Health | `GET /api/health` (what's connected; no secrets) |

## Data rules

We follow each website's robots.txt and terms, use official APIs and public listing pages, and only collect
publicly shared event information. Instagram, LinkedIn and Facebook posts reach us through official APIs,
Google search results, student and organizer submissions, and the browser extension, never by scraping
accounts. Every listing links back to the official registration page and uses our own short summary.

## License

MIT, see [LICENSE](LICENSE), except the landing page components in `apps/web/src/components/landing`,
which are adapted from [hackclub/site](https://github.com/hackclub/site) under GPL-3.0
(see the [NOTICE](apps/web/src/components/landing/NOTICE.md) there).
