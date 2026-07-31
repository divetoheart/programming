import { STORAGE_KEY, GAME_VERSION } from '../config/balance.js';
import { assertGameState } from './invariants.js';

export const saveGame = (state) => {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return true;
};
export const hasSavedGame = () => typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(STORAGE_KEY));
export const loadGame = () => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const state = JSON.parse(raw);
  if (state.version !== GAME_VERSION) throw new Error('This save belongs to an incompatible game version.');
  assertGameState(state);
  return state;
};
export const deleteSave = () => { if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY); };
export const exportSave = (state) => btoa(unescape(encodeURIComponent(JSON.stringify(state))));
export const importSave = (encoded) => {
  const state = JSON.parse(decodeURIComponent(escape(atob(encoded.trim()))));
  if (state.version !== GAME_VERSION) throw new Error('Incompatible save version.');
  assertGameState(state);
  return state;
};
