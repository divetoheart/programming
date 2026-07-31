import {
  kingdomTroopCap, kingdomTroopPopulation, kingdomPopulation, kingdomPopulationCap,
  kingdomBuildings, kingdomArmies, buildingShare
} from '../game/selectors.js';
import { formatNumber, formatPercent, escapeHtml } from './format.js';
import { meter, summaryShell } from './panel-utils.js';

export const kingdomPanel = (state) => {
  const kingdom = state.kingdoms['kingdom-player'];
  const used = kingdomTroopPopulation(state, kingdom.id);
  const cap = kingdomTroopCap(state, kingdom.id);
  const content = `<div class="panel-section"><div class="stat-grid">
    <div class="stat-card"><small>Population</small><b>${formatNumber(kingdomPopulation(state, kingdom.id))}</b><small>Cap ${formatNumber(kingdomPopulationCap(state, kingdom.id))}</small></div>
    <div class="stat-card"><small>Troop Cap</small><b>${formatNumber(used)} / ${formatNumber(cap)}</b>${meter(used / Math.max(1, cap) * 100)}</div>
    <div class="stat-card"><small>Fervor</small><b>${formatPercent(kingdom.fervor)}</b>${meter(kingdom.fervor)}</div>
    <div class="stat-card"><small>Buildings</small><b>${kingdomBuildings(state, kingdom.id).length}</b><small>${Math.round(buildingShare(state, kingdom.id) * 100)}% of realm</small></div>
    <div class="stat-card"><small>Armies</small><b>${kingdomArmies(state, kingdom.id).length}</b></div>
    <div class="stat-card"><small>Crisis</small><b>${kingdom.debtTurns ? `${kingdom.debtTurns} debt` : kingdom.famineTurns ? `${kingdom.famineTurns} famine` : 'Stable'}</b></div>
  </div></div><div class="panel-section"><div class="panel-title">Campaign doctrine</div><div class="support-item">Civil buildings create wealth and population. Military buildings turn population into defensible troop capacity. Full three-building compositions define a region’s role.</div></div><div class="action-grid"><button class="action-button" data-command="open-save"><strong>Save tools</strong><small>Export, import, or restart</small></button><button class="action-button" data-command="open-help"><strong>Rules reference</strong><small>Counters, capture, supply, and gestures</small></button></div>`;
  return { summary: summaryShell(kingdom.name, kingdom.ruler), content };
};

export const faithPanel = (state) => {
  const kingdom = state.kingdoms['kingdom-player'];
  const content = `<div class="panel-section"><div class="stat-grid"><div class="stat-card"><small>Deity</small><b>${escapeHtml(kingdom.faith.deity)}</b></div><div class="stat-card"><small>Domain</small><b>${escapeHtml(kingdom.faith.domain)}</b></div><div class="stat-card"><small>Fervor</small><b>${formatPercent(kingdom.fervor)}</b>${meter(kingdom.fervor)}</div></div></div><div class="support-list"><div class="support-item"><b>Temples</b><br>Generate gold and Fervor, support local morale and population growth, and slow desertion.</div><div class="support-item"><b>Capturing a Temple</b><br>Seizes offerings and supplies, raises the attacking army’s morale, reduces desertion pressure, and damages enemy Fervor.</div><div class="support-item"><b>Fervor in war</b><br>Improves morale stability, retreat survival, and resistance to desertion. It does not replace physical defense.</div></div>`;
  return { summary: summaryShell(kingdom.faith.name, `${kingdom.faith.deity} · ${kingdom.faith.domain}`), content };
};

export const logPanel = (state) => ({
  summary: summaryShell('Campaign Chronicle', `Round ${state.round} · ${state.eventLog.length} recorded events`),
  content: `<div class="event-list">${state.eventLog.map((event) => `<div class="event-item">${escapeHtml(event.message)}<small>Round ${event.round}</small></div>`).join('')}</div>`
});
