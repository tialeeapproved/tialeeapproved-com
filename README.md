# tialeeapproved.com

Creator media kit. One long scrolling page, six sections, audience numbers pulled
from the Instagram Graph API.

**Stack:** Astro 5 + `@astrojs/vercel`. There is a build step.
**Deploy:** Vercel project `tialeeapproved/tialeeapproved-com`, already connected to this repo.
**Domain:** tialeeapproved.com (currently at Squarespace — DNS not yet pointed at Vercel).

---

## Run it

```bash
npm install
cp .env.example .env   # fill in the values below
npm run dev            # http://localhost:4321
npm run build          # production build
```

## Environment variables

| Variable | Needed for | Notes |
|---|---|---|
| `IG_PAGE_TOKEN` | Live data | Page access token. **Does not expire.** |
| `IG_USER_ID` | Live data | `17841401714449516` |
| `META_APP_ID` | Re-auth | `1069748672100278` |
| `META_APP_SECRET` | Re-auth | App settings → Basic |
| `KV_REST_API_URL` | Live data | Upstash Redis — separate DB from tiafowlkes.com |
| `KV_REST_API_TOKEN` | Live data | |
| `CRON_SECRET` | Cron auth | Any long random string |

**The site builds and renders correctly with none of these set** — see below.

---

## How the numbers get on the page

```
Instagram Graph API
        │  daily, 10:00 UTC, via Vercel Cron -> /api/cron/sync
        ▼
   Upstash Redis  ──────────►  the page reads from here
        │                              ▲
        │ (missing or unreachable)     │
        ▼                              │
 src/data/snapshot.json  ──────────────┘   committed fallback
```

The page never calls Meta at request time. A Meta outage, an unset env var, or an
expired data-access window degrades to slightly stale numbers instead of a broken
section. The masthead says `LIVE` or `SNAPSHOT` so you can always tell which you
are looking at.

Refresh the committed fallback by hand:

```bash
npm run sync:snapshot   # rewrites src/data/snapshot.json from the live API
```

---

## ⚠️ The one real deadline

The Page token does not expire (`debug_token` reports `expires_at: 0`), so there is
no refresh job. But **Meta's data access expires 2026-11-24** — 90 days from the last
authorization, standard for an app in development mode.

The cron response includes `dataAccessDaysLeft` and starts emitting a `warning` field
at 14 days. When it fires, either:

1. Repeat the Generate Access Token step in the Graph API Explorer and swap
   `IG_PAGE_TOKEN` (about two minutes), or
2. Submit the app for business verification, which removes the limit.

If it lapses, the site falls back to `snapshot.json` and keeps working. It does not
break — it just stops updating.

---

## Layout

| Path | What it is |
|---|---|
| `src/data/content.ts` | **All copy.** Wording changes happen here, never in markup. |
| `src/data/snapshot.json` | Committed data fallback. Generated, do not hand-edit. |
| `src/lib/instagram.ts` | Graph API client. The only file that talks to Meta. |
| `src/lib/store.ts` | Redis read/write with snapshot fallback. |
| `src/pages/index.astro` | The whole page. |
| `src/pages/api/cron/sync.ts` | Daily job. The only server-rendered route. |
| `src/styles/global.css` | Design tokens at the top; restyling means changing those. |
| `scripts/snapshot.mjs` | Regenerates the committed fallback. |

---

## Content source

Positioning, credentials, the Corporate Exit Chronicles case study and the
cross-platform numbers all come from Tia's own media kit deck (Aug 2026), held in
`src/data/content.ts`.

**Where the deck and the API disagree, the API wins for Instagram and the deck wins
for everything the API cannot see.** TikTok, LinkedIn and YouTube are self-reported
and labelled as such on the page — only Instagram carries a LIVE badge. Update those
three by hand in `platforms` when they move.

## Known gaps

- **Post thumbnails are Instagram CDN URLs, which expire.** The daily cron refreshes
  them so the live path stays valid, but images in the committed snapshot will rot.
  Broken ones hide themselves rather than showing a broken-image icon. Proper fix:
  have the cron mirror thumbnails into Vercel Blob.
- **Autoplay comes from two places.** Meta returns a direct mp4 for only some Reels
  and those URLs expire, so which posts it covers changes. Files in `public/clips/`
  never expire and always win — add them to `videoOverrides` keyed by media id.
  All clips play muted, loop, and pause when scrolled out of view.
- **Work is ranked by reach over an 18-month window.** Older posts carry incoherent
  legacy metrics (a 2022 post reports 1.78M views against 1,058 reach), which a brand
  would rightly question. The window keeps the section defensible.
- **Visual design is deliberately plain.** Structure carries the "digital files" idea;
  decoration comes later. Restyling should only mean changing tokens in
  `global.css`, not touching markup.

## Working agreement

Branch, preview URL, then merge on Tia's explicit approval. Never push straight to
`main`.
