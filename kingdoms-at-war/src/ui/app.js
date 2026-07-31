import { PLAYER_ID } from '../config/balance.js';
import { createGame } from '../game/create-game.js';
import { saveGame, loadGame, hasSavedGame, deleteSave } from '../game/persistence.js';
import { getArmy } from '../game/selectors.js';
import { neighborsOf } from '../core/graph.js';
import { SetupView } from './setup-view.js';
import { panelForSelection } from './panels.js';
import { mountGameShell, bindGameShell, renderHeader, renderDock } from './app-shell.js';
import { handleDock, handleCommand } from './app-commands.js';
import { openBuild, openRecruit, openTransfer, openSettings, openSaveTools, openHelp } from './app-modals.js';
import { dispatchPlayer, perform, endPlayerTurn } from './app-turns.js';

export class GameApp {
  constructor(root) {
    this.root = root;
    this.state = null;
    this.selection = { kind: 'overview' };
    this.selectedArmyId = null;
    this.busy = false;
    this.initialCentered = false;
  }

  start() { this.showSetup(); }

  showSetup() {
    const setup = new SetupView(this.root, {
      hasSave: hasSavedGame(),
      onStart: ({ profile, seed }) => {
        this.state = createGame(profile, seed);
        saveGame(this.state);
        this.mountGame();
      },
      onLoad: () => {
        try { this.state = loadGame(); this.mountGame(); }
        catch (error) { deleteSave(); alert(error.message); this.showSetup(); }
      }
    });
    setup.render();
  }

  mountGame() {
    const openingArmy = Object.values(this.state.armies).find((army) => army.ownerId === PLAYER_ID);
    if (openingArmy) {
      this.selectedArmyId = openingArmy.id;
      this.selection = { kind: 'army', id: openingArmy.id };
    }
    mountGameShell(this);
    bindGameShell(this);
    this.render();
    requestAnimationFrame(() => {
      if (!this.initialCentered) {
        this.mapView.resetView(PLAYER_ID);
        this.initialCentered = true;
      }
    });
  }

  render() {
    if (!this.state) return;
    if (this.selectedArmyId && !getArmy(this.state, this.selectedArmyId)) this.selectedArmyId = null;
    if (this.selection.kind === 'army' && !getArmy(this.state, this.selection.id)) this.selection = { kind: 'overview' };
    this.renderHeader();
    const reachable = this.reachableSlots();
    const mapSelection = this.selection.kind === 'slot' ? { ...this.selection, armyId: this.selectedArmyId } : this.selection;
    this.mapView.render(this.state, mapSelection, reachable);
    const panel = panelForSelection(this.state, this.selection, this.selectedArmyId);
    this.sheet.setContent(panel.summary, panel.content);
    this.renderDock();
  }

  renderHeader() { renderHeader(this); }
  renderDock() { renderDock(this); }

  reachableSlots() {
    const army = getArmy(this.state, this.selectedArmyId);
    if (!army || army.ownerId !== PLAYER_ID || army.movement <= 0) return new Set();
    return new Set(neighborsOf(this.state.map, army.slotId));
  }

  reachableSlotsFor(armyId) {
    const army = getArmy(this.state, armyId);
    return new Set(army ? neighborsOf(this.state.map, army.slotId) : []);
  }

  selectArmy(armyId) {
    if (this.busy) return;
    const army = getArmy(this.state, armyId);
    this.selectedArmyId = army.ownerId === PLAYER_ID ? armyId : this.selectedArmyId;
    this.selection = { kind: 'army', id: armyId };
    this.sheet.setState('half');
    this.render();
  }

  selectSlot(slotId) {
    if (this.busy) return;
    this.selection = { kind: 'slot', id: slotId };
    this.sheet.setState('half');
    this.render();
  }

  async dragArmy(armyId, targetSlotId) {
    const army = getArmy(this.state, armyId);
    if (!army || army.ownerId !== PLAYER_ID || !this.reachableSlotsFor(armyId).has(targetSlotId)) {
      this.toasts.show('Armies move one connected slot at a time.', 'error');
      return;
    }
    this.selectedArmyId = armyId;
    await this.dispatchPlayer({ type: 'MOVE', ownerId: PLAYER_ID, armyId, targetSlotId });
  }

  handleDock(command) { handleDock(this, command); }
  handleCommand(button) { handleCommand(this, button); }
  openBuild(regionId, slotId) { openBuild(this, regionId, slotId); }
  openRecruit(slotId) { openRecruit(this, slotId); }
  openTransfer(command, sourceUnits, context, label) { openTransfer(this, command, sourceUnits, context, label); }
  openSettings() { openSettings(this); }
  openSaveTools() { openSaveTools(this); }
  openHelp() { openHelp(this); }
  dispatchPlayer(action) { return dispatchPlayer(this, action); }
  perform(action) { return perform(this, action); }
  endPlayerTurn() { return endPlayerTurn(this); }
}
