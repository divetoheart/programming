import {
  slotPanel, armyPanel, regionPanel, kingdomPanel, faithPanel, logPanel
} from './selection-panels.js';

export const panelForSelection = (state, selection, selectedArmyId) => {
  if (!selection || selection.kind === 'overview') return kingdomPanel(state);
  if (selection.kind === 'slot') return slotPanel(state, selection, selectedArmyId);
  if (selection.kind === 'army') return armyPanel(state, selection);
  if (selection.kind === 'region') return regionPanel(state, selection);
  if (selection.kind === 'kingdom') return kingdomPanel(state);
  if (selection.kind === 'faith') return faithPanel(state);
  if (selection.kind === 'log') return logPanel(state);
  return kingdomPanel(state);
};
