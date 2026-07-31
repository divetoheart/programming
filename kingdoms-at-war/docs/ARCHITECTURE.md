# Architecture

## Design constraints

1. The simulation must be deterministic from a seed.
2. The interface must never contain authoritative game rules.
3. AI and human kingdoms must use the same action API.
4. Every committed state must satisfy structural invariants.
5. Important changes must produce a visible timeline event.
6. The runtime must remain deployable as static files.

## Project structure

```text
kingdoms-at-war/
├── index.html
├── manifest.webmanifest
├── sw.js
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── game.css
│   ├── components.css
│   └── responsive.css
├── src/
│   ├── config/       # Balance data; no state mutation
│   ├── core/         # RNG, graph, IDs, and math utilities
│   ├── game/         # Authoritative simulation domains
│   ├── ui/           # Rendering, touch input, panels, and animation
│   └── main.js
├── tests/
└── docs/
```

## Action pipeline

```text
Human gesture or AI choice
        ↓
Plain action object
        ↓
engine.executeAction(currentState, action)
        ↓
Structured clone of current state
        ↓
Domain validator and mutation
        ↓
Elimination / victory evaluation
        ↓
Invariant validation
        ↓
{ state: nextState, timeline: TimelineEvent[] }
        ↓
UI animates timeline against old state
        ↓
UI commits and saves nextState
```

This transaction-like flow prevents partial mutations when validation fails and lets the interface show movement or combat before the final state appears.

## State model

The root state contains:

- metadata and save version
- deterministic random seed
- round, active kingdom, phase, and winner
- kingdom records
- procedural map graph
- mobile armies
- persistent sieges
- event chronicle
- user playback settings

A `Region` contains exactly three `Slot` objects. A slot may contain one building and any number of mobile armies. Empty slots have no owner. Ownership exists on buildings, not regions.

Region control, status, support, composition bonuses, population totals, and caps are derived by selector functions. They are not duplicated as mutable state.

## Simulation modules

### Configuration

`src/config/` owns balance constants and immutable definitions for buildings, units, terrain, domains, and names. Costs and effects should be changed here rather than inside action logic.

### Procedural map

`map-generator.js` creates a seeded 5×4 world layout, three-slot local graphs, land connections, optional sea lanes, four distant starting positions, neutral settlements, and fair starting packages. `invariants.js` confirms the graph remains connected and every reference is valid.

### Economy

`economy.js` calculates building output, terrain modifiers, composition support, army upkeep, higher Garrison upkeep, population growth, supply recovery, morale recovery, crises, and Army desertion.

### Campaign actions

Construction, recruitment, movement, combat, siege, capture, army management, and turn progression are separate modules. Each exposes validators where useful and returns timeline events.

### AI

`ai.js` produces ordinary action objects. It privately scores legal expansion, siege, construction, upgrade, recruitment, and mobilization choices. Difficulty is not implemented through hidden combat bonuses.

## UI modules

`MapView` owns the SVG camera and pointer gestures. `BottomSheet` owns only its expansion gesture. `panels.js` produces context-specific command surfaces. `GameApp` coordinates state, actions, AI turns, saving, and modal workflows. `TimelinePlayer` renders slow observable resolution without knowing how outcomes were calculated.

## Extension points

The current architecture is ready for:

- online multiplayer by moving `executeAction` to a server authority
- commanders as referenced entities attached to armies
- diplomacy as kingdom-to-kingdom state and actions
- fog of war through perspective-aware selectors
- additional maps and map generators
- richer naval zones without rewriting land combat
- replay files composed of initial seed plus validated actions
