# Crown & Conquest

A complete mobile-first, single-player turn-based strategy game for the browser. One human kingdom competes with three deterministic AI kingdoms on a procedurally generated twenty-region map.

The project is intentionally dependency-free at runtime. It uses standards-based HTML, CSS, SVG, and JavaScript modules so the repository folder can be served or deployed directly.

## Play locally

From this folder:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` in a browser. The game is designed portrait-first and remains usable on tablets and desktop browsers.

## Deploy

On Vercel, import `divetoheart/programming` and set the project **Root Directory** to:

```text
kingdoms-at-war
```

No build command or framework preset is required.

## Tests

```bash
npm test
```

The Node test suite verifies procedural connectivity, three-slot region invariants, starting positions, construction prerequisites, independent building capture, Temple rewards, turn processing, and legal AI decisions.

A Playwright browser smoke test is also included:

```bash
npm run test:browser
```

It renders the actual module graph in Chromium at a 390×844 viewport, starts a campaign, verifies all twenty regions and sixty slots, checks the mobile command surface, captures screenshots, and fails on browser console errors. It requires Python Playwright and a Chromium executable.

## Major systems

- Kingdom, ruler, banner, faith, deity, and domain creation
- Seeded procedural map generation with twenty connected regions
- Exactly three physical slots per region
- Five building types with limits, upgrades, and composition roles
- Independent building ownership and capture
- Empty-slot occupation without ownership
- Gold, Provisions, Materials, Population, Population Cap, and Troop Cap
- Armies and building-level Garrisons
- Footmen, Archers, Cavalry, Siege Trains, and crewed Warships
- Population-backed recruitment and naval transport capacity
- Terrain-specific movement, population, production, defense, and unit effects
- Morale, Supply, Fervor, Desertion Pressure, debt, and famine
- Visible movement, battle, siege, capture, construction, repair, and economic ticks
- Persistent multi-turn sieges
- Three AI personalities with legal-action planning
- Local autosave plus portable save-code export/import
- Touch pan, pinch zoom, long-press inspection, swipeable sheets, and drag movement
- Installable progressive-web-app shell and runtime offline caching

## Architecture

The rules simulation is isolated from presentation. The UI submits actions to `src/game/engine.js`; the engine clones and validates state, applies one domain operation, checks invariants and victory, then returns a new state plus a visible animation timeline.

See:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/RULES.md`](docs/RULES.md)
