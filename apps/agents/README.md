# Discovery agents

The engine that finds hackathons and keeps HackathonFinder's listings current. It reads hackathon
platforms, event sites and web search, turns complete discoveries into listings (dates in India time,
place on the map, banner copied to Cloudinary, our own short summary), merges the same event found on
several sites into one listing, and publishes complete candidates automatically. Admins can remove
scams and correct listings after reports.

One function, `runScrape()` in `src/run.ts`, does a whole run. The CLI, the website's **Scrape now**
button, the scheduled runs and the cron route all call it.

## Sources

| Source | How we read it | Key needed | What it gives |
|---|---|---|---|
| Unstop (`unstop`) | Public listing API (`/api/public/*`, allowed by robots.txt), plus each competition's page for new listings | — | Open hackathons, venue, deadline, team size, fee, prizes, banner, event dates |
| Devfolio (`devfolio`) | The search API devfolio.co uses (open for applications, and opening soon) | — | Dates with offsets, venue, team size, cover image |
| Devpost (`devpost`) | Listing API (open and upcoming) | — | Mostly online, worldwide; in-person events only when clearly in India |
| MLH (`mlh`) | The season page's embedded JSON (mlh.io → mlh.com) | — | Online events and those in India (in-person abroad is rejected) |
| HackerEarth (`hackerearth`) | Public events feed | — | Online hackathons and challenges, cover images |
| lablab.ai (`lablab`) | schema.org Events on the newest event pages | — | Online AI hackathons, banners |
| KnowAFest (`knowafest`) | Public event-search JSON API, plus schema.org Event on each event page | — | College hackathons across India, posters, the organizer's own registration form |
| Web search (`web`) | Google Custom Search (`GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX`) or Brave Search (`BRAVE_SEARCH_API_KEY`) when set, else DuckDuckGo's HTML page; then each result page through the polite client | optional | College and event pages for our cities, plus public Hack2skill, DoraHacks, Kaggle, Luma and Eventbrite pages |
| Instagram (`instagram`) | Public posts found by web search (`site:instagram.com …`); with `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID`, also hashtag posts from Meta's official Graph API | optional | Post links, dates and QR registration; complete discoveries publish automatically |
| LinkedIn (`linkedin`), Facebook (`facebook`) | Public posts and events found by web search | optional | Public event leads; complete discoveries publish automatically |

DuckDuckGo often shows crawlers a challenge page. We stop at the first one (no retries, no
CAPTCHA solving, no browser user agent), mark the source **blocked** and try again next run. For
reliable web and social discovery add a Google Custom Search or Brave Search API key.

There are no direct connectors for Hack2skill, DoraHacks, Kaggle, Eventbrite or Luma yet. Web search
now queries their public indexed pages and reads only pages the polite client is allowed to fetch;
search coverage can still miss listings, and pages protected by a bot challenge remain unavailable.

## Running it

```bash
pnpm agents:run                                  # every enabled source, written to MONGODB_URI
pnpm agents:run --source unstop,devfolio --limit 20
pnpm agents:run --dry-run                        # read and show what would happen; nothing is written or uploaded
pnpm agents:sources                              # sources, missing keys, health; add --sync to create the Source docs
pnpm agents:schedule                             # long-running worker: scrapes at 02:00 and 14:00 India time
pnpm agents:repair                               # bring existing listings in line with the current rules (--dry-run to preview)
pnpm --filter @hackathonfinder/agents test       # tests (a throwaway MongoDB; never the real one)
```

The root `.env` is read by everything. The website imports the engine as `@hackathonfinder/agents`.

## Schedule and "Scrape now"

Scrapes run at **02:00 and 14:00 Asia/Kolkata**. Each time is a slot with an id like
`2026-10-25T02:00+05:30`, and `AgentRun.slot` is unique, so a slot runs once even when several
things fire for it:

- **The website** (`apps/web/src/instrumentation.ts`): on a long-running Node server (`next start`
  or `next dev`) it starts the timer when the server starts. Off with `SCRAPE_SCHEDULER=off`, and on
  Vercel. In production it also catches up once on startup if the latest slot was missed while the
  server was off (nothing ran since that slot, and the next slot is more than an hour away);
  `SCRAPE_CATCHUP=on|off` overrides this, e.g. to try it in development.
- **Vercel Cron** (`apps/web/vercel.json`): `GET /api/cron/scrape` at 20:30 and 08:30 UTC, with
  `Authorization: Bearer $CRON_SECRET`. It waits for the run and stops taking new items after four
  minutes (the function's limit is five); what's left is picked up by the next run.
- **The worker** (`pnpm agents:schedule`): the same timer for hosts without the website, with the
  same catch-up.

**Scrape now** in the admin dashboard calls `startScrape()` (`apps/web/src/server/scrape.ts`): it
records the run and returns at once; the work carries on in the background and writes its progress,
counts and every item it created, updated, merged, sent to review or rejected into the `AgentRun`, so
the dashboard can follow it.

Only one scrape runs at a time: a unique index on `AgentRun` (one `running` run per agent) makes the
database refuse a second one, so a click during a scheduled run gets that run back. A running run
writes `heartbeatAt` at least once a minute; one silent for 30 minutes is taken as dead (its server
stopped or restarted) and marked failed with that reason, the next time anything starts a scrape or
the dashboard reads the runs. Runs stop taking new items after 40 minutes; the rest waits for the next
run.

## What a run does

1. **Read** every enabled source in parallel. Each site gets one request at a time with a pause in
   between, after robots.txt; a source that fails or is blocked doesn't stop the others (the run ends
   `partial`, and the source's health shows it).
2. **Normalize** each candidate: dates in India time, mode, our city slug (localities map to their city;
   other cities keep their name, e.g. `bhopal` / "Bhopal"), team size, fee, prizes, eligibility, themes
   (rule-based tagger in `packages/ai`) and type.
3. **Skip what hasn't changed.** Every candidate's content is hashed (`RawItem`); if it is the same as
   last time and the listing already has its banner, only "last checked" moves. Detail pages are read
   only for new listings and ones still without an image, so a second run takes seconds per source.
4. **Validate**: title, dates, deadline, a registration link and the mode are required; ended events,
   new events whose registration closed, and in-person or hybrid events outside India are rejected.
   Events that aren't hackathon-type are rejected too (see below). Rules flag high fees, URL
   shorteners, payment links, odd prizes and spam words; those flags are informational and do not
   stop a complete candidate from publishing.
5. **Enrich**: in-person events in India are placed on the map with OpenStreetMap Nominatim (venue
   first, then the city; one request a second; every answer cached in `GeoCache`; a hit in another
   state is ignored). The banner (else the organizer's logo) is copied to Cloudinary. When
   registration is by QR code, the poster's QR is read and its link used.
6. **Dedupe** against recent listings (never the sample listings): same source id, same page, same
   registration link, or a very similar title starting within two days in the same city.
7. **Publish**: every structurally complete candidate goes **live**, including low-confidence results,
   search results, social leads and flagged listings. Listings remain marked unverified until a person
   checks them; visitors can report scams and admins can remove or restore them. Candidates missing
   required fields or failing date/relevance rules stay out. Existing pending scraper listings are
   published when a later run can validate them; rejected and removed listings stay out.

## Accuracy rules

Everything on a listing comes from the source; when the source doesn't say, we don't either.

- **Dates** are the source's own. Unstop's timeline is read from the competition page: the start is
  the first round or "important date" that is the event itself (hackathon, finale, offline round,
  presentations); else the dates the description gives for the hackathon ("Hackathon: 28–29
  October"); else the first round or date after registration closes that isn't paperwork; else
  Unstop's own `start_date` (when the competition opened; online challenges run from then). The end
  is the latest round end, `end_date` or the description's end date that isn't before the start
  (results announcements don't count); with nothing after the start it is a one-day event. The
  registration deadline is never used as a stand-in for the start. Devfolio, MLH, HackerEarth,
  lablab.ai and KnowAFest give start and end directly; Devpost gives the submission period.
- **Team size**: when neither the data nor the description states one, `teamSizeKnown` is false
  (`teamMin`/`teamMax` hold a 1–4 default only so the record is complete) and the summary says
  nothing about teams.
- **Themes** come only from strong signals: the source's own tags, the title, or an explicit track
  list in the description ("Themes: …"). A word somewhere in a long description doesn't count. With
  no signal, there is no theme (or open innovation when the source says so) and the summary makes no
  theme claim.
- **Prizes**: only amounts the source states (platform prize fields, or a prize line with a currency
  in the description). Unknown stays 0.
- **Hybrid events abroad** are in-person first and rejected like any in-person event outside India.
  Only remote-first ones (MLH `hybrid_digital`, lablab.ai's online build with an optional on-site day)
  are listed online, and their summary says where they are based.
- **Hackathon-type only**: platform categories are loose (Unstop's "hackathons" include drone races).
  An event is rejected as "not a hackathon-type event" only when its title is clearly another kind
  (robotics or drone races, sports and esports, quizzes, cultural events, fest passes) or its tags are
  mostly robotics/drones/esports, and nothing in the title or tags says hackathon, ideathon, hack,
  code, build or a tech challenge. When unsure, it stays.
- **Placeholder banners** (a site's default picture, like KnowAFest's `knowafest-event-default.png`)
  count as no image.

When these rules change, bump `PIPELINE_VERSION` in `src/run.ts`: the next scrape reads every source
event again in full and rewrites what it derives (dates, team size, themes, our summary, prizes)
on the listings it made, and takes down listings the rules now turn away. `pnpm agents:repair`
(`--dry-run` to preview) does the same from the stored source data without asking the sources again
(everything but dates), and splits listings that wrongly merged two events of one platform.
Listings an admin has verified keep their copy and themes.

## Data rules

- Every request goes through `src/http.ts`: robots.txt first, an honest user agent
  (`CRAWLER_USER_AGENT`), one request per site at a time, backoff on 429/5xx, time and size limits.
  Bot checks and CAPTCHAs stop the source; we never try to get around them.
- An SSRF guard (`src/net.ts`) refuses localhost, private, link-local and internal hosts on every
  request and redirect, and before any image is mirrored.
- No logins, ever. We don't crawl Instagram, LinkedIn or Facebook: posts reach us through search
  results, Meta's official Graph API (with a token), the browser extension and submissions.
- Official APIs (Graph API, Custom Search, Brave, Nominatim, Cloudinary) follow their own terms and
  limits instead of robots.txt. Geocoding data © OpenStreetMap contributors (ODbL).
- Scraped text is only read, never shown: every listing gets our own template summary (or Claude's,
  when `ANTHROPIC_API_KEY` is set) and links to the official registration page. Strings are capped
  and HTML is stripped; nothing from a source is used as a database query operator.
- Secrets never reach the logs: run logs mask tokens in URLs and credentials in connection strings.

## Images

Banners are uploaded to Cloudinary by URL (Cloudinary fetches them; when a site refuses Cloudinary we
download the image politely and upload the bytes), signed, into `hackathonfinder/banners`, with a
public id from the source, the event id and a hash of the image URL and `overwrite=false`, so a rerun
never stores a copy twice. Listings use the Cloudinary URL with `f_auto,q_auto,c_limit,w_1200`; the
640 px and 1400 px versions (cards, hero) are generated at upload time (eager), so the first visitor
doesn't wait for them. The original is kept in `sourceImageUrl`. If an upload fails, the source link is kept and the next run
tries again. Without Cloudinary, banners link to their source. No banner and no logo: the website
shows an event photo instead.

## Adding a source

1. Write `src/connectors/<slug>.ts` exporting a `Connector` (`src/types.ts`): `slug` (add it to
   `SOURCES` in `packages/shared/src/catalog.ts`), `kind`, `trust`, a one-line `description`, and
   `fetch(ctx)` returning `RawCandidate[]`. Map only what the source states; dates as ISO strings
   (with an offset when the source has one), the official event page as `registrationUrl`, the banner
   as `imageUrl`. Use `ctx.http` for every request.
2. If the list leaves out the banner or dates, add `detail(candidate, ctx)`; the runner calls it only
   when needed.
3. Register it in `src/connectors/index.ts`, add a test with a small saved fixture in `test/`, and run
   `pnpm agents:run --source <slug> --dry-run`.
