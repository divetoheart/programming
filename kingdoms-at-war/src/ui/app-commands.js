import { PLAYER_ID } from '../config/balance.js';
import { getArmy, getSlot, getRegionBySlot } from '../game/selectors.js';

export const handleDock = (app, command) => {
  if (command === 'end') { app.endPlayerTurn(); return; }
  if (command === 'map') {
    app.sheet.setState('peek');
    if (!['slot', 'army', 'region'].includes(app.selection.kind)) app.selection = { kind: 'overview' };
  } else {
    app.selection = { kind: command };
    app.sheet.setState('expanded');
  }
  app.render();
};

export const handleCommand = (app, button) => {
  const command = button.dataset.command;
  const slotId = app.selection.kind === 'slot'
    ? app.selection.id
    : app.selection.kind === 'army'
      ? getArmy(app.state, app.selection.id)?.slotId
      : button.dataset.slotId;
  const regionId = slotId ? getRegionBySlot(app.state, slotId)?.id : button.dataset.regionId;

  if (command === 'select-slot') { app.selectSlot(button.dataset.slotId); return; }
  if (command === 'center-slot') { app.mapView.centerOn(slotId, 1); app.sheet.setState('peek'); return; }
  if (command === 'center-army') { app.mapView.centerOn(getArmy(app.state, app.selection.id).slotId, 1); app.sheet.setState('peek'); return; }
  if (command === 'show-moves') { app.selectedArmyId = app.selection.id; app.sheet.setState('peek'); app.render(); return; }
  if (command === 'open-build') { app.openBuild(regionId, slotId); return; }
  if (command === 'upgrade') { app.dispatchPlayer({ type: 'UPGRADE', ownerId: PLAYER_ID, regionId, slotId }); return; }
  if (command === 'repair') { app.dispatchPlayer({ type: 'REPAIR', ownerId: PLAYER_ID, regionId, slotId }); return; }
  if (command === 'open-recruit') { app.openRecruit(slotId); return; }
  if (command === 'open-mobilize') { app.openTransfer('MOBILIZE', getSlot(app.state, slotId).building.garrison, { slotId }, 'Form army'); return; }
  if (command === 'open-garrison') {
    const armyId = app.selection.kind === 'army' ? app.selection.id : app.selectedArmyId;
    const army = getArmy(app.state, armyId);
    if (!army) { app.toasts.show('Select a friendly army first.', 'error'); return; }
    app.openTransfer('GARRISON', army.units, { armyId }, 'Station troops');
    return;
  }
  if (command === 'open-split') {
    const army = getArmy(app.state, app.selection.id);
    app.openTransfer('SPLIT_ARMY', army.units, { armyId: army.id }, 'Create detachment');
    return;
  }
  if (command === 'merge-armies') { app.dispatchPlayer({ type: 'MERGE_ARMIES', ownerId: PLAYER_ID, armyIds: button.dataset.armyIds.split(',') }); return; }
  if (command === 'move-selected') {
    if (!app.selectedArmyId) { app.toasts.show('Select an army first.', 'error'); return; }
    app.dispatchPlayer({ type: 'MOVE', ownerId: PLAYER_ID, armyId: app.selectedArmyId, targetSlotId: slotId });
    return;
  }
  if (command === 'begin-siege') { app.dispatchPlayer({ type: 'BEGIN_SIEGE', ownerId: PLAYER_ID, armyId: app.selectedArmyId, targetSlotId: slotId }); return; }
  if (command === 'advance-siege') { app.dispatchPlayer({ type: 'ADVANCE_SIEGE', ownerId: PLAYER_ID, siegeId: button.dataset.siegeId }); return; }
  if (command === 'abandon-siege') { app.dispatchPlayer({ type: 'ABANDON_SIEGE', ownerId: PLAYER_ID, siegeId: button.dataset.siegeId }); return; }
  if (command === 'open-save') { app.openSaveTools(); return; }
  if (command === 'open-help') app.openHelp();
};
