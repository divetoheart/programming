# Solvyn RPG

A browser-native 3D RPG project built outward from one polished playable arrival: entering the Solvyn capital and Solvyr Castle.

## Current playable slice

- First-person King's Road approach
- South Gate entrance into Solvyr
- Crown Street traversal
- Solvyr Castle exterior and inner court
- Interactive castle guard
- Raising portcullis with persistent world state
- Great Hall interior and royal dais
- Location discovery + versioned local save
- Stylized procedural architecture and instanced vegetation

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Controls

- WASD — move
- Mouse — look
- Shift — sprint
- Space — jump
- E — interact
- Escape — release mouse

## Technical direction

Three.js + Vite, clean modular JavaScript, data-driven world metadata, procedural/reusable geometry, lightweight custom collision, and browser localStorage persistence.

The project deliberately avoids a heavy physics stack for this milestone. The M1 / 8 GB target is treated as the performance floor.

See `docs/PROJECT_STATE.md` for durable architecture and milestone state.
