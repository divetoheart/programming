import { makeId } from '../core/ids.js';

export const timelineEvent = (type, payload = {}, duration = 'normal') => ({ id: makeId('timeline'), type, duration, ...payload });
export const logEvent = (state, type, message, ownerId = null) => {
  const event = { id: makeId('event'), round: state.round, type, message, ownerId };
  state.eventLog.unshift(event);
  state.eventLog = state.eventLog.slice(0, 80);
  return event;
};
