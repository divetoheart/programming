# Solvyn RPG — Project State

## Creative north star

The player should not feel like they are walking through a technical demo. They should feel like they have stepped into a small but real RPG world that existed before they arrived and will keep moving after they leave.

The current experience is deliberately narrow: arrive at the capital of Solvyn, move through the city, present a sealed summons at Solvyr Castle, and enter the royal court. Every system added at this stage must improve that experience or make it more durable.

## Experience arc

1. **King's Road** — trees and stone frame the first city reveal.
2. **South Gate** — bells, guards, notices and human activity establish the capital as inhabited.
3. **Crown Street** — shops, smoke, carts, citizens, humor and incidental interaction create texture.
4. **Castle Ascent** — the street compresses and the architecture becomes colder, taller and more ceremonial.
5. **Castle Gate** — a named interaction changes persistent world state and physically opens access.
6. **Inner Court** — city noise falls away; guards, water, training clutter and castle routines replace market life.
7. **Great Hall** — warmer firelight, petitioners, a central runner and stronger vertical rhythm create a distinct interior mood.
8. **Royal Dais** — the chamberlain acknowledges the player's arrival and leaves the larger game hanging just beyond the slice.

## Established architecture

- Renderer: Three.js
- Build: Vite
- Perspective: first person for this milestone
- Collision: lightweight 2D capsule-vs-AABB movement collision
- Persistence: versioned localStorage save
- Audio: procedural Web Audio API; no downloaded audio assets required
- World composition: shared primitive geometry + authored procedural composition + structured location data
- Art direction: weathered limestone, blue-black slate, oxblood cloth, old gold, cedar timber, amber fire
- Visual motif: three-point crown
- Active scene: one bounded city/castle slice, not an open-world monolith

## Durable world state

Current save state persists:
- player position + camera orientation
- castle portcullis state
- discovered location zones
- authored moments already seen
- incidental interactions used

Save version is `v2`. The experience intentionally starts fresh from the King's Road after this visual/experience overhaul.

## Living-world systems

Current lightweight simulation includes:
- walking citizens on short routes
- stationary NPCs who turn toward the nearby player
- guards and petitioners
- moving market cart
- animated cat
- circling birds
- chimney smoke
- banner motion
- torch flicker
- zone-sensitive ambience
- authored one-time world moments

These are intentionally simple systems with reusable update hooks rather than one-off cutscenes.

## Performance strategy

Baseline target: **2020 M1 MacBook Air, 8 GB**.

Current rules:
- adaptive renderer pixel ratio (~0.9–1.45)
- one 1024² shadow-casting directional light
- point lights do not cast shadows
- exponential fog constrains useful view distance
- instanced approach vegetation
- shared box/cylinder/cone/sphere geometry for most world objects
- stylized low-poly silhouettes instead of imported high-density models
- procedural audio instead of streamed audio files
- no general-purpose physics engine
- no texture-heavy environment set
- bounded world simulation and NPC count
- no combat/inventory/quest framework loaded into this slice

## Quality bar

New work should be judged by:
- whether the player notices an authored moment rather than a feature list
- silhouette and composition at walking speed
- sense of place and kingdom identity
- believable background activity
- tactile movement and sound response
- stable frame pacing on target hardware
- whether simple geometry reads as a deliberate art choice rather than placeholder content

## Next milestone

Playtest the live build end to end before widening scope.

Specifically inspect:
- first reveal timing and skyline
- whether South Gate feels busy enough without visual clutter
- NPC/cart pathing and accidental intersections
- Crown Street navigation width
- castle gate interaction readability
- portcullis timing and audio
- court-to-hall contrast
- Great Hall proportions and lighting
- performance on the target MacBook
- any collision traps

Only after this slice feels convincing should the project add combat, inventory, quests, equipment, larger world streaming, or a deeper NPC simulation.
