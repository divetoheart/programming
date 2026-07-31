import { PLAYER_ID, MAX_AI_ACTIONS } from '../config/balance.js';
import { executeAction } from '../game/engine.js';
import { chooseAIAction } from '../game/ai.js';
import { saveGame } from '../game/persistence.js';

export const perform = async (app, action) => {
  const result = executeAction(app.state, action);
  await app.timeline.play(result.timeline, app.state.settings.speed);
  app.state = result.state;
  saveGame(app.state);
  app.render();
};

export const dispatchPlayer = async (app, action) => {
  if (app.busy) return;
  if (app.state.activeKingdomId !== PLAYER_ID) {
    app.toasts.show('Wait for the rival kingdoms to finish.', 'error');
    return;
  }
  app.busy = true;
  app.renderHeader();
  app.renderDock();
  try { await perform(app, action); }
  catch (error) { app.toasts.show(error.message, 'error', 3600); }
  finally { app.busy = false; app.render(); }
};

export const endPlayerTurn = async (app) => {
  if (app.busy || app.state.activeKingdomId !== PLAYER_ID) return;
  app.busy = true;
  app.sheet.setState('peek');
  app.renderHeader();
  app.renderDock();
  try {
    await perform(app, { type: 'END_TURN', ownerId: PLAYER_ID });
    while (app.state.activeKingdomId !== PLAYER_ID && !app.state.winnerId) {
      const aiId = app.state.activeKingdomId;
      let actionCount = 0;
      while (actionCount < MAX_AI_ACTIONS && app.state.activeKingdomId === aiId && !app.state.winnerId) {
        const action = chooseAIAction(app.state, aiId, actionCount);
        if (!action) break;
        try { await perform(app, action); }
        catch (error) { console.warn('AI action rejected', action, error); break; }
        actionCount += 1;
      }
      if (app.state.activeKingdomId === aiId && !app.state.winnerId) await perform(app, { type: 'END_TURN', ownerId: aiId });
    }
  } catch (error) {
    app.toasts.show(error.message, 'error');
  } finally {
    app.busy = false;
    app.render();
  }
};
