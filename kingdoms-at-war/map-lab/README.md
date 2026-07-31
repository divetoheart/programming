# Crown & Conquest Map Lab

A standalone procedural-map prototype used to solve the game's world presentation before integrating it into the campaign UI.

## Scope

- 60 irregular contiguous land tiles
- 20 regions containing exactly three connected tiles each
- Continuous coastline, elevation, biomes and terrain under political borders
- Generated mountain ranges, forests, farmland, rivers, roads, holdings and banners
- Thin tile borders and heavier three-tile region borders
- Mobile pan, pinch zoom, tile selection, region focus and world view
- Terrain and political map modes
- Web Worker generation
- Layered viewport canvases so terrain, features, politics and labels can evolve independently

## Run

```bash
python3 -m http.server 4174
```

Open `http://localhost:4174/kingdoms-at-war/map-lab/` when serving from the repository root, or `http://localhost:4174/` when serving this folder directly.

## Test

```bash
npm test
```

The generator test validates 60 tiles, 20 connected three-tile regions, river generation and region boundaries across multiple seeds.
