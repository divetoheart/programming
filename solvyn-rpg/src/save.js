const KEY = "solvyn.save.v1";
const VERSION = 1;

const defaults = {
  version: VERSION,
  player: { x: 0, y: 0, z: 128, yaw: 0, pitch: 0 },
  world: { castleGateOpen: false, discovered: [] }
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    if (parsed.version !== VERSION) return structuredClone(defaults);
    return {
      version: VERSION,
      player: { ...defaults.player, ...(parsed.player || {}) },
      world: {
        castleGateOpen: Boolean(parsed.world?.castleGateOpen),
        discovered: Array.isArray(parsed.world?.discovered) ? parsed.world.discovered : []
      }
    };
  } catch {
    return structuredClone(defaults);
  }
}

export function writeSave(save) {
  save.version = VERSION;
  localStorage.setItem(KEY, JSON.stringify(save));
}

export function resetSave() {
  localStorage.removeItem(KEY);
}
