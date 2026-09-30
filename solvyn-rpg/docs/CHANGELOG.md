# Changelog

## 0.2.0 — Experience Pass

Rebuilt the Solvyr arrival around authored player experience rather than feature breadth.

### Added
- opening city reveal and chapter/location moments
- new Solvyn visual identity and three-point crown motif
- denser South Gate, Crown Street, Castle Ascent, Inner Court and Great Hall
- animated banners, smoke, torches and birds
- lightweight NPC walking/awareness
- market cart traffic and a small animated cat
- multiple incidental NPC/environment interactions
- procedural ambient wind, city murmur, hall tone, footsteps, bells and portcullis sound
- smoother movement acceleration and sprint camera response
- adaptive render resolution
- persistent moments/interactions in save state
- distant mountain silhouette

### Changed
- save version reset to v2 so the redesigned experience starts from the King's Road
- objective flow now matches the authored arrival sequence
- castle gate and Great Hall composition substantially rebuilt
- world state documentation now treats experience quality as the gating milestone

## 0.1.0 — Foundation

Initial playable path from the King's Road to the royal dais with movement, collision, zones, a castle guard interaction, portcullis persistence and a procedural environment.


## 0.3.0 — Surface & density pass

- Added procedural material textures and bump detail for stone, plaster, timber, slate, cloth, grass and cobbles.
- Added facade skins and stonework overlays with repeated detail scale.
- Added arches, shutters, doors, eaves, curbs, crates, barrels, sacks, benches, grass tufts, stones, laundry and ivy.
- Added Great Hall dust motes.
- Raised baseline resolution and shadow fidelity while retaining adaptive scaling for the M1/8GB performance floor.
- Bumped save version to v3 so the revised arrival is experienced from the beginning.


## 0.4.0 — Painted-world reset + iPhone controls

- Reframed the art style as painted storybook medievalism rather than low-poly realism.
- Added shared rounded geometry, gabled roofs, clustered foliage, rolling terrain and more sculpted NPC silhouettes.
- Replaced the prior detail treatment with painterly procedural materials and a lightweight illustration post-process.
- Added iPhone-safe full-screen layout, portrait FOV tuning and dynamic-resolution rendering.
- Added gesture-only mobile play: drag-to-move, drag-to-look, push-to-sprint, tap-to-interact and flick-to-jump.
- Removed reliance on virtual UI controls.
- Bumped save version to v4 so the redesigned arrival begins from the intended opening composition.
