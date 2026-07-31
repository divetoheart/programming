import { TICK_MS } from '../config/balance.js';
import { unitCount } from '../config/units.js';
import { sleep } from './dom.js';
import { formatNumber, titleCase } from './format.js';

export class TimelinePlayer {
  constructor({ overlayRoot, mapView, toasts }) {
    this.overlayRoot = overlayRoot;
    this.mapView = mapView;
    this.toasts = toasts;
    this.paused = false;
    this.combat = null;
    this.siege = null;
  }

  async play(timeline, speed = 'normal') {
    for (const event of timeline) {
      await this.waitIfPaused();
      this.renderEvent(event);
      const base = TICK_MS[speed] ?? TICK_MS.normal;
      const multiplier = event.duration === 'slow' ? 1.22 : event.duration === 'fast' ? 0.55 : 1;
      await sleep(base * multiplier);
    }
    this.clearTransient();
  }

  async waitIfPaused() { while (this.paused) await sleep(100); }

  renderEvent(event) {
    switch (event.type) {
      case 'movementTick': this.mapView.animateMovement(event); break;
      case 'income': this.toasts.show(`${event.delta.gold >= 0 ? '+' : ''}${event.delta.gold} gold · ${event.delta.provisions >= 0 ? '+' : ''}${event.delta.provisions} provisions`, 'info', 1800); break;
      case 'combatStarted': this.combat = event; this.renderCombat({ ...event, tick: 0, totalTicks: 12, attackerUnits: {}, defenderUnits: {}, attackerMorale: 0, defenderMorale: 0 }); break;
      case 'combatTick': this.renderCombat(event); break;
      case 'combatEnded': this.toasts.show(event.outcome === 'attacker' ? 'The attacking army broke through.' : 'The defenders held.', event.outcome === 'attacker' ? 'success' : 'error'); break;
      case 'siegeStarted': this.siege = event; this.renderSiege({ ...event, tick: 0, totalTicks: 6, fortification: 0, supply: 0, morale: 0 }); break;
      case 'siegeTick': this.renderSiege(event); break;
      case 'siegeSurrender': this.toasts.show('The garrison has surrendered.', 'success'); break;
      case 'buildingCaptured': this.mapView.pulseSlot(event.slotId); this.toasts.show(`${titleCase(event.buildingType)} captured · ${formatNumber(event.loot.gold)} gold looted`, 'success', 3200); break;
      case 'buildingBuilt': this.mapView.pulseSlot(event.slotId); this.toasts.show(event.message, 'success'); break;
      case 'buildingRepaired': this.mapView.pulseSlot(event.slotId); this.toasts.show(`${titleCase(event.buildingType)} repaired.`, 'success'); break;
      case 'buildingUpgraded': this.mapView.pulseSlot(event.slotId); this.toasts.show(`Upgraded to ${titleCase(event.buildingType)}.`, 'success'); break;
      case 'desertion': this.toasts.show(event.message, 'error', 3500); break;
      case 'kingdomEliminated': this.toasts.show(event.message, 'error', 4200); break;
      case 'victory': this.renderVictory(event); break;
      default: break;
    }
  }

  renderCombat(event) {
    const attackerCount = unitCount(event.attackerUnits ?? {}); const defenderCount = unitCount(event.defenderUnits ?? {});
    this.overlayRoot.innerHTML = `<div class="timeline-overlay"><div class="timeline-card"><div class="timeline-title"><span>Battle in progress</span><span>Tick ${event.tick}/${event.totalTicks}</span></div><div class="force-row"><div class="force-block"><small>Attacker</small><div class="force-count">${attackerCount}</div>${event.attackerMorale ? `<small>Morale ${event.attackerMorale} · Supply ${event.attackerSupply}</small>` : ''}</div><strong>VS</strong><div class="force-block"><small>Defender</small><div class="force-count">${defenderCount}</div>${event.defenderMorale ? `<small>Morale ${event.defenderMorale} · Supply ${event.defenderSupply}</small>` : ''}</div></div><div class="tick-track">${Array.from({ length: event.totalTicks }, (_, index) => `<span class="tick-dot ${index < event.tick ? 'done' : ''}"></span>`).join('')}</div>${event.terrain ? `<div class="support-item" style="margin-top:12px">${titleCase(event.terrain)} terrain · Fortification ${event.fortification}</div>` : ''}</div></div>`;
  }

  renderSiege(event) {
    this.overlayRoot.innerHTML = `<div class="timeline-overlay"><div class="timeline-card"><div class="timeline-title"><span>Siege resolving</span><span>Tick ${event.tick}/${event.totalTicks}</span></div><div class="stat-grid"><div class="stat-card"><small>Fortification</small><b>${event.fortification}</b></div><div class="stat-card"><small>Supply</small><b>${event.supply}</b></div><div class="stat-card"><small>Morale</small><b>${event.morale}</b></div></div><div class="tick-track">${Array.from({ length: event.totalTicks }, (_, index) => `<span class="tick-dot ${index < event.tick ? 'done' : ''}"></span>`).join('')}</div></div></div>`;
  }

  renderVictory(event) {
    this.overlayRoot.innerHTML = `<div class="modal-layer"><section class="modal-card"><div class="setup-crest">♛</div><h2 class="setup-title">Realm Conquered</h2><p class="setup-copy">${event.message}</p><button class="large-button" onclick="location.reload()">Return to title</button></section></div>`;
  }

  clearTransient() {
    if (!this.overlayRoot.querySelector('.modal-layer')) this.overlayRoot.innerHTML = '';
    this.combat = null; this.siege = null;
  }
}
