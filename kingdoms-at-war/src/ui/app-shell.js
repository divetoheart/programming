import { PLAYER_ID } from '../config/balance.js';
import { getArmy } from '../game/selectors.js';
import { emblemGlyph } from './setup-view.js';
import { formatNumber, escapeHtml } from './format.js';
import { listen } from './dom.js';
import { MapView } from './map-view.js';
import { BottomSheet } from './bottom-sheet.js';
import { Toasts } from './toast.js';
import { Modal } from './modal.js';
import { TimelinePlayer } from './timeline-player.js';

export const mountGameShell = (app) => {
  app.root.innerHTML = `
    <main class="game-shell" data-game-shell>
      <header class="game-header" data-game-header></header>
      <section class="map-viewport" data-map-root></section>
      <div class="map-fab-stack"><button class="map-fab" data-map-reset aria-label="Center on army">◎</button><button class="map-fab" data-open-settings aria-label="Game settings">⚙</button></div>
      <aside class="bottom-sheet peek" data-bottom-sheet></aside>
      <nav class="game-dock" data-game-dock></nav>
      <div class="toast-stack" data-toast-root></div>
      <div data-timeline-root></div>
      <div data-modal-root></div>
    </main>`;
  app.headerRoot = app.root.querySelector('[data-game-header]');
  app.mapRoot = app.root.querySelector('[data-map-root]');
  app.sheetRoot = app.root.querySelector('[data-bottom-sheet]');
  app.dockRoot = app.root.querySelector('[data-game-dock]');
  app.toasts = new Toasts(app.root.querySelector('[data-toast-root]'));
  app.modal = new Modal(app.root.querySelector('[data-modal-root]'));
  app.sheet = new BottomSheet(app.sheetRoot);
  app.mapView = new MapView(app.mapRoot, {
    onSelectSlot: (slotId) => app.selectSlot(slotId),
    onLongPressSlot: (slotId) => { app.selectSlot(slotId); app.sheet.setState('expanded'); },
    onSelectArmy: (armyId) => app.selectArmy(armyId),
    onSelectRegion: (regionId) => { app.selection = { kind: 'region', id: regionId }; app.sheet.setState('half'); app.render(); },
    onDragArmy: (armyId, targetSlotId) => app.dragArmy(armyId, targetSlotId)
  });
  app.timeline = new TimelinePlayer({ overlayRoot: app.root.querySelector('[data-timeline-root]'), mapView: app.mapView, toasts: app.toasts });
};

export const bindGameShell = (app) => {
  app.root.querySelector('[data-map-reset]').addEventListener('click', () => {
    const army = app.selectedArmyId ? getArmy(app.state, app.selectedArmyId) : null;
    if (army) app.mapView.centerOn(army.slotId, 0.9);
    else app.mapView.resetView(PLAYER_ID);
  });
  app.root.querySelector('[data-open-settings]').addEventListener('click', () => app.openSettings());
  listen(app.sheetRoot, 'click', '[data-command]', (_event, button) => app.handleCommand(button));
  listen(app.dockRoot, 'click', '[data-dock]', (_event, button) => app.handleDock(button.dataset.dock));
};

export const renderHeader = (app) => {
  const player = app.state.kingdoms[PLAYER_ID];
  const active = app.state.kingdoms[app.state.activeKingdomId];
  app.headerRoot.style.setProperty('--kingdom-color', player.color);
  app.headerRoot.innerHTML = `<div class="header-row"><div class="kingdom-mark">${emblemGlyph(player.emblem)}</div><div class="turn-block"><strong>${escapeHtml(player.name)}</strong><span>Round ${app.state.round} · ${app.busy ? escapeHtml(active?.name ?? 'Resolving') : app.state.phase === 'player' ? 'Your turn' : escapeHtml(active?.name ?? 'AI turn')}</span></div><button class="header-button" data-header-log aria-label="Open chronicle">☰</button></div><div class="resource-strip"><div class="resource-pill"><b>● ${formatNumber(player.resources.gold)}</b><small>Gold</small></div><div class="resource-pill"><b>◆ ${formatNumber(player.resources.provisions)}</b><small>Provisions</small></div><div class="resource-pill"><b>■ ${formatNumber(player.resources.materials)}</b><small>Materials</small></div></div>`;
  app.headerRoot.querySelector('[data-header-log]').addEventListener('click', () => {
    app.selection = { kind: 'log' };
    app.sheet.setState('expanded');
    app.render();
  });
};

export const renderDock = (app) => {
  const activeKind = app.selection.kind;
  const disabled = app.busy || app.state.activeKingdomId !== PLAYER_ID || Boolean(app.state.winnerId);
  app.dockRoot.innerHTML = `
    <button class="dock-button ${['slot','army','region','overview'].includes(activeKind) ? 'active' : ''}" data-dock="map"><span class="dock-icon">⌖</span><span class="dock-label">Map</span></button>
    <button class="dock-button ${activeKind === 'kingdom' ? 'active' : ''}" data-dock="kingdom"><span class="dock-icon">♜</span><span class="dock-label">Kingdom</span></button>
    <button class="dock-button ${activeKind === 'faith' ? 'active' : ''}" data-dock="faith"><span class="dock-icon">✦</span><span class="dock-label">Faith</span></button>
    <button class="dock-button ${activeKind === 'log' ? 'active' : ''}" data-dock="log"><span class="dock-icon">▤</span><span class="dock-label">Chronicle</span></button>
    <button class="dock-button end-turn" data-dock="end" ${disabled ? 'disabled' : ''}><span class="dock-icon">♛</span><span class="dock-label">End turn</span></button>`;
};
