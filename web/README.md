# YBS Finder (web)

Mobile-first responsive web app for browsing Yangon YBS bus routes and stops from the parent open-data JSON files.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Leaflet / OpenStreetMap
- Reads `../api/routes.json` and `../ybs_*_data.json`

## Run locally

From this `web/` folder:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Screens

- `/` — brand + search + featured routes
- `/plan` — A→B trip planner (direct / 1 transfer / 2 transfers)
- `/stops` — stop-centric search (stop → all passing lines)
- `/routes` — full catalog with filters
- `/routes/[slug]` — stop list + map + save favorite
- `/favorites` — saved lines/stops (device localStorage)
- `/nearby` — GPS nearest stops across the catalog

## UX extras

- EN ↔ MM language toggle (header)
- Loading skeletons + empty states
- Install-to-home-screen prompt (PWA / iOS hint)

## Trip planner APIs

- `GET /api/stops/search?q=Sule`
- `GET /api/stops/by-id?id=<placeId>`
- `GET /api/plan?from=<placeId>&to=<placeId>&maxTransfers=2`
- Optional `refresh=1` rebuilds the in-memory transit index
- Shareable UI: `/plan?from=<id>&to=<id>&xfer=2&sort=balanced|fewer_walks|fewer_hops`

### Planner UX extras

- Map of selected trip (bus path + walk + transfer markers)
- Google / Apple Maps walking links on walk legs
- Sort: balanced time / fewer walks / fewer hops
- Static duration estimate (not live ETA)
- Recent A→B history (localStorage)
- Ambiguous same-name stop hints (check curb/side)

### Direction / lane handling

Most YBS route files encode **go + return** as one ordered stop list. The planner:

1. Detects out-and-back routes and splits them into **outbound** / **inbound** segments
2. Plans rides only along a single direction (no mixing go+return in one ride)
3. Keeps opposite curbs as separate places (~11m coordinate ids)
4. May insert a short **cross-to-lane** walk when the picked place is across the street from the boarding curb

## Notes

- Static data only — not live tracking or ETA
- Designed phone-first; tablet/desktop use split layouts
- Add to Home Screen via browser (PWA manifest included)
