import { UNIT_TYPES } from '../config/units.js';
import { regionalSupport, compositionBonus } from '../game/selectors.js';
import { formatNumber, titleCase, escapeHtml } from './format.js';

export const meter = (value, warningAt = 40) => `<div class="meter ${value < 20 ? 'danger' : value < warningAt ? 'warning' : ''}" style="--meter:${Math.max(0, Math.min(100, value))}%"><span></span></div>`;
export const ownerName = (state, id) => state.kingdoms[id]?.name ?? 'Unclaimed';
export const formationRows = (units) => Object.entries(units)
  .filter(([, count]) => count > 0)
  .map(([id, count]) => `<div class="unit-row"><div class="unit-icon">${UNIT_TYPES[id].icon}</div><div><b>${UNIT_TYPES[id].name}</b><small>${formatNumber(UNIT_TYPES[id].soldiers * count)} personnel</small></div><strong>${count}</strong></div>`)
  .join('') || '<div class="support-item">No formations stationed.</div>';
export const effectLabel = (key, value) => `${titleCase(key)} ${value > 0 ? '+' : ''}${Math.abs(value) < 1 ? `${Math.round(value * 100)}%` : value}`;
export const summaryShell = (title, subtitle, badge = '') => `<div class="sheet-summary-main"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></div>${badge}`;

export const regionEffects = (state, region, ownerId) => {
  const support = regionalSupport(state, region, ownerId);
  const effects = Object.entries(support)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `<div class="support-item">${effectLabel(key, value)}</div>`)
    .join('');
  const composition = compositionBonus(state, region, ownerId);
  return `<div class="panel-section"><div class="panel-title">Regional role</div><div class="support-list"><div class="support-item">${composition ? `<b>${escapeHtml(composition.name)}</b>` : 'Composition bonus inactive'}</div>${effects}</div></div>`;
};
