# Cattle Sale Catalog PDF Viewer

React + pdf.js mobile web viewer that spotlights individual lots inside a live
PDF render, backed by Supabase for lot data, watchlist, and analytics.

## Setup

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_DEFAULT_SALE_ID, VITE_CATALOG_PDF_URL
npm run dev
```

Open `http://localhost:5173/?sale_id=YOUR_SALE_ID` (or rely on
`VITE_DEFAULT_SALE_ID` if you'd rather not pass it in the URL).

## Supabase setup

1. Run the migrations in `supabase/migrations/` (via `supabase db push` or by
   pasting them into the SQL editor) — these add the `watchlist` and
   `analytics_events` tables on top of your existing schema.
2. Deploy the two edge functions:
   ```bash
   supabase functions deploy get-sale-lots
   supabase functions deploy get-geo-ip
   ```
3. `get-sale-lots` uses the service role key (already wired via
   `SUPABASE_SERVICE_ROLE_KEY`, which Supabase injects automatically for
   deployed functions) to bypass RLS and assemble each lot's coordinates,
   sale info, media, and ratings in one round trip.

## What's a placeholder vs. production-ready

- **Icons** (`BottomNav.jsx`, `FocusedLotControls.jsx`, `MoreCarousel.jsx`) —
  the Home icon and star icon are close approximations; the More and Jump
  icons are rough stand-ins. Swap all four for the actual Figma SVG exports
  before shipping, per the spec.
- **Spotlight cutout size** (`src/lib/geometry.js`) — `CUTOUT_WIDTH_PT` /
  `CUTOUT_HEIGHT_PT` are fixed constants, since the `lots` table stores a
  point + zoom rather than a full bounding box. Tune these to match your
  catalog's actual lot-block dimensions, or add `width`/`height` columns to
  `lots` for a fully data-driven box.
- **Geo IP** — `get-geo-ip` calls `ipapi.co` server-side as a default
  provider; swap in whatever geo-IP service you'd rather use.

## Project structure

```
src/
  components/     PdfStage, SpotlightMask, BottomNav, JumpModal,
                   WatchlistModal, MoreCarousel, FocusedLotControls, Modal
  hooks/          useSaleLots, useProfile, useWatchlist
  lib/            supabaseClient, pdfjs (worker setup), geometry, analytics
supabase/
  functions/      get-sale-lots, get-geo-ip
  migrations/     watchlist, analytics_events
```
