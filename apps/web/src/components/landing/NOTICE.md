# Landing page: origin and license

The landing page components in this folder are adapted from Hack Club's website,
[hackclub/site](https://github.com/hackclub/site), which is licensed under the
GNU General Public License v3.0. A copy of that license is in [LICENSE](LICENSE).

## Changes from the original (October 2026)

- Rewritten for HackathonFinder: every piece of Hack Club text, every photo, sticker, logo,
  mascot and video was removed and replaced with HackathonFinder content and original artwork
  (generated event posters, text stickers, doodles and two new mascots in `art.tsx`).
- The hero polaroids, the "Near you" mosaic and the feature cards use event photos from
  Unsplash (free under the Unsplash License), stored in `public/photos` and credited in
  `photos.ts`. None of them are Hack Club's.
- The licensed Phantom Sans and Zarathustra fonts were replaced with the free Google Fonts
  Figtree and Young Serif (`fonts.ts`).
- Ported from Next.js 16, React 19 and next-intl to this app's Next.js 14 and React 18,
  with all styles scoped under `.landing`.
- Sections read live listings from `@hackathonfinder/shared` instead of Hack Club's APIs.
