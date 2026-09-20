# The Bell Below — Mournreach

A private, persistent, highly mechanical dark-fantasy AI RPG built as a Next.js app.

This is not a chat transcript wearing an RPG skin. The mechanical engine owns the campaign state; the narrator receives the full canonical world bible and the complete current save on every turn.

## What is implemented

### Persistent world
- GitHub-backed canonical save ledger on a dedicated `campaign-data` branch
- LocalStorage backup/fallback when repo sync is not configured
- World clock, day, time, season, weather, moon, region, location, danger, and map position
- Persistent NPC location/status/relationship/trust/fear/memory
- Persistent faction reputation, stance, goals, and discovered secrets
- Persistent rumors, flags, discovered/visited locations, quest stages, journal, and chronology

### Mechanical character system
- HP, stamina, resolve, hunger
- Armor, evasion, speed, XP, level
- Encumbrance and item weight
- Six attributes and sixteen skills
- Equipment slots
- Item quantity, value, durability, tags, and categories
- Conditions and localized wounds
- d20 checks with transparent attribute + skill math and DCs
- Action classification for combat, stealth, travel, investigation, medicine, occult work, lore, social checks, lockwork, and athletics
- Mechanical consequences are resolved before narration

### Long-term continuity
- Canonical memory bank with importance and last-referenced turn
- Automatic journal entries on every action
- Milestones with progress/targets/rewards
- Quest stages rather than binary quest flags
- The narrator receives the COMPLETE world bible and COMPLETE campaign state every turn

### Homebrew setting
The world of **Mournreach** currently includes:
- 5 major regions
- 5 active power factions
- 3 faith systems
- 6 original languages
- custom grammar, scripts, vocabulary, and sample phrases
- a defined magical/metaphysical rule set
- historical eras and the central mystery of the Bell Beneath the World
- original regional SVG illustrations stored in the repository

### Interface
Mobile-first dark-fantasy UI with:
- Play / current scene
- transparent roll math
- mechanical HUD
- interactive persistent world map
- character sheet
- inventory and durability
- journal
- memory bank
- milestones
- world codex
- factions
- NPC relationship state
- custom language phrasebooks
- rumors
- always-visible action composer

## Private access

Set `GAME_PASSCODE` in production. The app stores an HTTP-only signed session cookie after successful unlock.

Set a separate `SESSION_SECRET` as well. If it is omitted, the passcode is used to derive the session signature.

## GitHub persistence

The app intentionally stores the live save on a **different branch** from the deployed code so each turn does not trigger a production redeploy.

Recommended configuration:

```env
GITHUB_SAVE_REPO=divetoheart/programming
GITHUB_SAVE_BRANCH=campaign-data
GITHUB_SAVE_PATH=dnd-world/data/campaign.json
GITHUB_SAVE_TOKEN=...
```

Use a fine-grained GitHub token restricted to this repository with **Contents: Read and write**.

Every successful turn writes the full canonical state as JSON with a commit such as:

`campaign: turn 42 — Gallowspire`

This creates a human-readable campaign history directly in Git.

## AI narrator

The application itself has no subscription system or artificial turn currency.

The narrator adapter is intentionally provider-agnostic. Configure any OpenAI-compatible chat-completions endpoint:

```env
AI_API_KEY=...
AI_CHAT_URL=https://provider.example/v1/chat/completions
AI_MODEL=your-model
```

No AI configuration is required to run the game. Without it, the deterministic mechanical engine remains functional and uses a built-in narrator fallback.

The AI is NOT authoritative over mechanics. It receives:
1. the complete world bible,
2. the complete current campaign state,
3. the player's action,
4. the already-resolved mechanical roll.

It is instructed not to secretly grant damage, healing, items, travel, reputation, death, quest completion, or other mechanical mutations in prose.

## Run locally

```bash
cd dnd-world
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel

Import `divetoheart/programming` and set the project Root Directory to:

`dnd-world`

Then add the environment variables from `.env.example`.

## Canon files

- `lib/world.ts` — immutable homebrew world bible
- `lib/types.ts` — canonical campaign schema
- `lib/seed.ts` — initial campaign state
- `lib/engine.ts` — mechanical resolution
- `lib/context.ts` — every-turn canon assembly
- `lib/narrator.ts` — provider-agnostic AI narration
- `lib/github-store.ts` — GitHub save ledger
- `app/api/play/route.ts` — authoritative turn pipeline

## Turn pipeline

`player action → canonical state load → mechanical inference → d20 resolution → validated resource/time changes → full-context narration → journal/memory update → GitHub commit → UI refresh`

That order is deliberate. Story follows state, not the other way around.
