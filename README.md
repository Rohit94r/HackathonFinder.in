# HackathonFinder.in

Every hackathon. One place. HackathonFinder finds hackathons from Unstop, Devfolio, Devpost, MLH, Google,
Instagram, LinkedIn, Facebook, college sites and more, and lists them in one searchable place, nearest first.
See [concept.md](concept.md) for the full product plan.

## What's in the box

| Part | Path | What it does |
|---|---|---|
| Website + API | `apps/web` | Next.js 14 site and REST API (`src/app/api`): listings, near me, cities, accounts, profiles, community, winning stories, Team Finder, submissions, admin |
| Discovery agents | `apps/agents` | Scout → Extract → Dedupe → Verify → Tag → Publish. Connectors for platforms, Google search, Instagram (official API) and watched college pages. See [apps/agents/README.md](apps/agents/README.md) |
| Browser extension | `apps/extension` | "Add to HackathonFinder" for Chrome: send any page or Instagram/LinkedIn post to the review queue. See [apps/extension/README.md](apps/extension/README.md) |
| Database | `packages/db` | MongoDB models (Mongoose), indexes, seed data, local MongoDB for development |
| AI | `packages/ai` | Claude-powered extraction from pages and posters, smart search, plus rule-based fallbacks |
| Shared | `packages/shared` | Types, cities, themes, sources, status rules, distance helpers |

## Run it locally

Needs Node 20.19+ and pnpm 10 (`npx pnpm@10` works if pnpm isn't installed).

```bash
pnpm install
cp .env.example .env      # everything is optional locally
pnpm dev                  # starts a local MongoDB (data in .data/mongo), seeds it, then http://localhost:3000
```

`pnpm dev` starts a real MongoDB on your machine when `MONGODB_URI` is empty, and loads the sample students,
hackathons, discussions, winning stories and team posts on first run. Set `MONGODB_URI` in `.env` to use
MongoDB Atlas instead.

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
| Discovery | `GOOGLE_CSE_KEY/CX`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `KAGGLE_*`, `EVENTBRITE_TOKEN` | Those connectors are skipped; key-free platform connectors still run |
| Scheduled jobs | `CRON_SECRET` | Jobs only run in development |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local MongoDB (if needed) + website |
| `pnpm build` / `pnpm start` | Production build and server for the website |
| `pnpm typecheck` | Type-checks every package |
| `pnpm test` | Runs the test suites |
| `pnpm db:seed` / `pnpm db:seed -- --reset` | Loads (or reloads) the sample content into `MONGODB_URI` |
| `pnpm db:local` | Just the local MongoDB |
| `pnpm agents:sources -- --sync` | Registers the discovery sources and shows their health |
| `pnpm agents:run -- --source devpost --limit 20` | Runs one connector through the whole pipeline |
| `pnpm agents:schedule` | Long-running scheduler for every source (and "Run now" requests from the admin dashboard) |

## Deploying

- **Website:** any Node host or Vercel (`apps/web`). Set the variables above. `apps/web/vercel.json` schedules
  deadline reminders daily and the weekly digest on Mondays (`/api/cron/reminders`, `/api/cron/digest`,
  authorised with `CRON_SECRET`).
- **Database:** MongoDB Atlas. Indexes are created by `pnpm db:seed` (it skips the sample content if any is
  already there) or on first use. Atlas → **Network Access** must allow your host: Vercel functions use
  dynamic egress IPs, so add `0.0.0.0/0` (or Vercel Secure Compute if you have it). Without this every page
  fails with `MongooseServerSelectionError` / `tlsv1 alert internal error`.
- **Agents:** a small always-on worker (Railway, Render, a VM, …) running `pnpm agents:schedule` with the
  same `.env`.

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
