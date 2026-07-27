# The Living Campaign

A mobile-first persistent D&D campaign dashboard built with Next.js.

## Included now

- Always-visible current prompt, response, roll, or attack
- Transparent dice and attack math
- Editable character sheet and hit points
- Inventory, quest, party, enemy, notes, and journal views
- Stylized world map with current location and objective
- Activity history
- Automatic browser persistence with `localStorage`
- Responsive desktop and mobile layout

## Run locally

```bash
cd dnd-world
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

Import the `divetoheart/programming` repository and set **Root Directory** to `dnd-world`. Vercel will detect Next.js automatically.

## Persistence roadmap

The current build saves immediately in the browser. The next production milestone is authenticated cloud persistence so the same campaign continues across devices. Recommended architecture:

1. Vercel authentication
2. Postgres database for campaigns and snapshots
3. Server actions/API routes for atomic state updates
4. Campaign event ledger for every prompt, response, roll, attack, item change, and quest update
5. Optional AI Dungeon Master endpoint that returns structured state mutations rather than untracked prose

The campaign data model is intentionally centralized in `app/page.tsx` for the prototype. It should be split into typed domain modules when cloud persistence is added.
