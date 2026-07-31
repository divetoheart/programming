import { SLOT_COUNT, NEUTRAL_ID } from '../config/balance.js';
import { BUILDING_TYPES } from '../config/buildings.js';
import { UNIT_TYPES } from '../config/units.js';
import { isConnected } from '../core/graph.js';

export const assertGameState = (state) => {
  if (!state?.map?.regions || !state.kingdoms || !state.armies) throw new Error('Invalid game state root.');
  if (!isConnected(state.map)) throw new Error('Map must remain connected.');
  const slotIds = new Set();
  for (const region of state.map.regions) {
    if (region.slots.length !== SLOT_COUNT) throw new Error(`${region.id} must contain exactly ${SLOT_COUNT} slots.`);
    for (const slot of region.slots) {
      if (slotIds.has(slot.id)) throw new Error(`Duplicate slot id ${slot.id}.`);
      slotIds.add(slot.id);
      if (slot.building) {
        if (!BUILDING_TYPES[slot.building.type]) throw new Error(`Unknown building type ${slot.building.type}.`);
        if (!state.kingdoms[slot.building.ownerId]) throw new Error(`Unknown building owner ${slot.building.ownerId}.`);
        for (const unitId of Object.keys(slot.building.garrison)) if (!UNIT_TYPES[unitId]) throw new Error(`Unknown unit ${unitId}.`);
      }
    }
  }
  for (const army of Object.values(state.armies)) {
    if (!slotIds.has(army.slotId)) throw new Error(`Army ${army.id} occupies missing slot.`);
    if (!state.kingdoms[army.ownerId] || army.ownerId === NEUTRAL_ID) throw new Error(`Army ${army.id} has invalid owner.`);
    for (const [unitId, count] of Object.entries(army.units)) {
      if (!UNIT_TYPES[unitId] || count < 0 || !Number.isInteger(count)) throw new Error(`Army ${army.id} has invalid unit state.`);
    }
  }
  return true;
};
