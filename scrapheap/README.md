# SCRAPHEAP

Early-access browser combat prototype.

## Current vertical slice
- 3D third-person arena rendered with Three.js
- 9 AI brawlers with pursuit/combat behavior
- melee combat, health, deaths, respawns and kill rewards
- physics-flavored knockback/ragdoll death presentation
- detachable/scavengeable bones, arms, legs and skulls
- junk inventory and free-component crafting discounts
- weapon progression: fists → bone club → scrap axe → chainsaw → rattle rifle
- desktop mouse/WASD controls and basic coarse-pointer controls
- procedural scrapyard arena, fog, lighting, debris and HUD

## Run
Serve this directory with any static HTTP server. `index.html` imports Three.js as a pinned browser ESM dependency.

## Vercel
Deploy with `scrapheap` as the project Root Directory. No build command is required for this static prototype.

## Next production milestones
Authoritative multiplayer/networking, actual rigid-body ragdolls, animation/audio pass, richer modular weapon assembly, multiple arenas, match flow/safe-zone system, persistence and matchmaking.