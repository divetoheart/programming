# Solvyn RPG

A browser-native 3D RPG prototype built around one high-polish vertical slice: arriving at **Solvyr**, capital of Solvyn, and entering Solvyr Castle.

This is intentionally not a broad RPG yet. The project is concentrating rendering, simulation, art direction, interaction, sound, and performance into a small experience that can become the quality bar for the larger game.

## Playable slice

King's Road → South Gate → Crown Street → Castle Ascent → Castle Gate → Inner Court → Great Hall → Royal Dais

The slice now includes:

- authored reveal moments and location beats
- responsive first-person movement with acceleration, sprint FOV and footsteps
- animated banners, smoke, fire, birds, citizens, cart traffic and a market cat
- interactable incidental characters and environmental details
- a persistent castle portcullis interaction
- procedural Web Audio ambience, bells, footsteps and gate movement
- a denser, more identifiable Solvyn architectural language
- adaptive render resolution for stable browser performance
- versioned local persistence

## Controls

- **WASD** move
- **Mouse** look
- **Shift** sprint
- **Space** jump
- **E** interact
- **Escape** release mouse

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Performance target

The baseline target remains a 2020 M1 MacBook Air with 8 GB memory. The scene favors shared primitive geometry, low-poly silhouettes, limited dynamic lights, one shadow-casting sun, instancing where it matters, procedural audio, no texture-heavy environment pack, and adaptive pixel ratio rather than brute-force asset density.
