# SCRAPHEAP

An asset-light third-person arena brawler vertical slice built for the browser. Nine scavengers enter a procedural junkyard while a crusher field closes around them. Defeated opponents become both scrap and recoverable fictional crafting components.

## Vertical slice

- Responsive shoulder camera, mouse aim, sprint, stamina and an invulnerable dodge window
- Eight-agent free-for-all AI with threat selection, spacing, strafing, retreat and bot-on-bot combat
- High-impact combat with knockback, camera shake, pooled debris and procedural audio
- Segment-based ragdoll deaths, detachable limbs and recoverable parts
- Kill-to-scrap economy and discounted fictional tool crafting at the field bench
- Closing-ring match structure, win/fail screens and local best-run persistence
- Authored procedural arena with collision, landmarks, cover, fog and adaptive resolution
- Landscape touch interface with safe-area support
- Vite project structure ready for Vercel

## Run

```sh
npm install
npm run dev
```

For a dependency-free smoke test, serve the directory as static files; the import map pins Three.js from jsDelivr.
