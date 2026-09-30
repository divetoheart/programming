# Solvyn RPG — Project State

## Creative north star

The player enters the Solvyn capital and then Solvyr Castle. The first experience should sell place, scale, atmosphere, and movement before broad RPG feature count.

## Established architecture

- Renderer: Three.js
- Build: Vite
- Perspective: first person for this milestone
- World composition: reusable procedural geometry + structured location data
- Collision: lightweight 2D capsule-vs-AABB movement collision
- Persistence: versioned localStorage save
- Art approach: stylized low/mid-poly, weathered royal stone, dark slate, old gold, cool haze, warm firelight
- Active scene: one bounded capital/castle slice, not an open-world monolith

## Durable world state

Current save state persists:
- player position + camera orientation
- castle portcullis state
- discovered location zones

## Current world

1. King's Road approach
2. Solvyr South Gate
3. Crown Street
4. Solvyr Castle gate
5. Inner Court
6. Great Hall
7. Royal dais

## Current interaction loop

Travel → discover capital → reach guarded castle gate → interact → world state changes → enter newly accessible space → reach destination.

## Performance rules already applied

- Pixel ratio capped at 1.5
- One 1024² shadow map
- Exponential fog limits useful view distance
- Instanced trees
- Primitive/reused materials
- No imported texture memory yet
- No general-purpose physics engine
- Bounded number of dynamic lights
- No per-frame object allocation in movement/collision

## Known limitations

- Architecture is procedural and intentionally asset-light; no authored GLB character/building set yet.
- NPC is a convincing interaction target but not yet schedule/AI driven.
- Terrain is flat for milestone one.
- No audio layer yet.
- Save migration currently resets incompatible save versions rather than transforming them.

## Next milestone

Do not widen the feature surface yet. First playtest:
- movement speed / mouse sensitivity
- approach scale
- castle silhouette
- whether Crown Street feels inhabited enough
- whether the gate interaction reads clearly
- Great Hall mood and proportions
- browser frame pacing on the target MacBook Air

Then improve this slice before adding combat, inventory, quests, or a larger world.
