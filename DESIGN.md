# HackathonFinder design system: "Hackathon Junction"

How hackathonfinder.in should look and feel. Read this before building or changing any page. Code lives in `apps/web`; tokens are in `tailwind.config.ts` and `src/app/globals.css`.

## 1. Visual theme and atmosphere

The site is a railway station for hackathons. Every hackathon is a ticket, cities are station signboards, sections are platforms, and the homepage has a live split-flap departures board.

- Day station (default): warm ticket paper, ink black, signboard yellow, signal red.
- Night station (dark mode): soot black with lamplight yellow.
- The navbar, footer and bottom bars are always dark (the station canopy), separated from the page by the yellow platform edge.
- It must read as a carefully built product, never as a template or an AI-generated page.

## 2. Colour palette and roles

| Token | Light | Dark | Use |
|---|---|---|---|
| `surface` | `#F3EEE3` | `#0E0D0B` | Page background (ticket paper / night) |
| `card` | `#FFFCF5` | `#1A1814` | Tickets, cards, inputs, menus |
| `ink` | `#16130F` | `#F4EEE2` | Text, borders as `ink/15` etc. |
| `muted` | `#6E665A` | `#A09788` | Secondary text |
| `line` | `#E0D7C7` | `#322E27` | Hairlines and dividers |
| `board` | `#FFC629` | same | Station boards, primary buttons, highlights. Always with `navy` text |
| `accent` | `#C8261D` | text uses `board` in dark | Links, "closing soon" urgency, accent words in titles |
| `navy` | `#16130F` | same | Fixed dark text on yellow or white |

Status colours are signals and mean the same everywhere: green = open, yellow = closing soon, red = happening now, grey = closed or over.

Never use raw Tailwind palette colours (slate, indigo, purple…) in the public site; use the tokens. Never use purple, and never use gradients as decoration. Functional gradients (steel rails, coach paint, a loading shimmer) are fine.

## 3. Typography

- Barlow Condensed (500 to 800): signage. `h1` and `h2` are condensed, bold and upper case. Buttons, chips, tabs and labels use it in caps with letter spacing.
- Barlow (400 to 700): body text.
- JetBrains Mono: ticket data, such as times, codes, counts, eyebrows and stub labels.
- Fonts are self-hosted in `src/app/fonts` with their OFL licences. Don't add Google Fonts links.
- Headings balance their lines; paragraphs avoid single-word last lines.
- Visitor-facing text: no em dashes, no emoji, "…" not "...", curly quotes.

## 4. Component styling

- **Ticket** (`HackathonCard`): paper with two punched notches, a dashed tear line and a stub holding prize and deadline, plus a ticket number and a barcode. Variants: standard (grid), featured (wide boarding pass), compact (slim row with a side stub).
- **Station board** (`StationBoard`): yellow plate, black inset rule, condensed caps, optional posts and code.
- **Platform sign** (`PlatformSign`): black square with a yellow number, then a mono label. Used over homepage sections.
- **Buttons**: `btn-primary` is a yellow board with a 2px ink border and a hard offset shadow that presses down; `btn-secondary` is the same in paper and ink. Square corners (4 to 6px radius). **No pill shapes.** Round is only for true circles: avatars, status dots, lamps.
- **Chips and tabs**: squared, condensed caps; the active one is lit (ink background).
- **Inputs**: paper, ink/20 border, yellow focus ring. At least 16px text on phones.
- **Feedback**: `toast()` for success; inline messages for errors, saying how to fix it.

## 5. Layout principles

- Content width `max-w-7xl` with 16/24/32px gutters (`container-page`).
- Homepage sections are numbered platforms: Featured, Departures, Waiting hall, Routes, Stations.
- One clear action per section. Real event banners or credited Unsplash photos in every image box, never AI-generated images.
- Lists of tickets are one column on phones and never wider than the screen (`min-w-0` on grid items).

## 6. Depth and elevation

Flat paper with restrained shadows. Tickets use a soft drop shadow that follows the punched shape. Buttons use a hard offset shadow. No glassmorphism, glow or neon.

## 7. Do's and don'ts

Do:
- Say plainly what the page does in its headline ("Find hackathons online and near you").
- Show only real, live numbers from the database, and show them as they are: no count-up animation (it shows wrong figures mid-count).
- Keep railway words playful but secondary to clarity (real status labels stay readable).
- Respect `prefers-reduced-motion` and offer "Pause animations" for anything that moves on its own.

Don't:
- Purple gradients, gradient text, pill buttons, emoji icons, em dashes.
- Fake reviews, testimonials, counters or metrics; "coming soon" promises; sample data.
- Vague or hype copy ("unlock", "seamless", "elevate", "journey"), cursor effects, heavy scroll animation.
- Moving decorative scenes such as the animated train that was tried on the homepage and removed (2026-11-05): the owner didn't like it.
- From the unslop audit (github.com/heydamir/unslop): exclamation marks; greeting headlines ("Welcome, Yash"); coloured glows on anything that isn't a live signal; radial colour washes or blobs behind content; `hover:scale` on cards or photos; looping motion on things that aren't live (a live departures board and a live dot are fine); `transition-all`; unverifiable claims ("Trusted by…", avatar rows, stars).
- AI-generated photos.

## 8. Responsive behaviour

- Check every change at 390, 768, 1024 and 1440px wide. No horizontal scroll anywhere.
- Phones get a bottom tab bar (Home, Explore, Near me, Saved, Teams) and, on a hackathon page, a sticky Register bar instead. Both reserve space with `--hf-dock`.
- Hover effects only on devices that can hover (`hoverOnlyWhenSupported`).
- Respect safe-area insets (notch and home indicator).

## 9. Prompt guide for AI agents

When asked to build or change UI here:
1. Use the tokens and components above; read `src/components/junction/Signs.tsx`, `src/components/hackathon/HackathonCard.tsx` and `src/app/globals.css` first.
2. Follow the don'ts in section 7 without exception.
3. Keep `src/data/legalData.ts` true: if a change collects, stores or shares new data, update the privacy policy in the same change.
4. Verify with a production build (`pnpm build`) and screenshots at phone and desktop widths before calling it done.
