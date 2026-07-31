import { PLAYER_ID } from '../config/balance.js';
import { saveGame, deleteSave, exportSave, importSave } from '../game/persistence.js';
import { buildModalBody, recruitModalBody, transferModalBody } from './modal-bodies.js';

export const openBuild = (app, regionId, slotId) => {
  app.modal.open({
    title: 'Construct building',
    body: buildModalBody(app.state, regionId, slotId),
    onBind: (card) => {
      card.querySelectorAll('[data-build-type]').forEach((button) => button.addEventListener('click', async () => {
        const action = { type: 'BUILD', ownerId: PLAYER_ID, regionId, slotId, buildingType: button.dataset.buildType };
        app.modal.close();
        await app.dispatchPlayer(action);
      }));
    }
  });
};

export const openRecruit = (app, slotId) => {
  app.modal.open({
    title: 'Recruit formation',
    body: recruitModalBody(slotId),
    onBind: (card) => {
      card.querySelectorAll('[data-recruit-type]').forEach((button) => button.addEventListener('click', async () => {
        app.modal.close();
        await app.dispatchPlayer({ type: 'RECRUIT', ownerId: PLAYER_ID, slotId, unitType: button.dataset.recruitType, quantity: 1 });
      }));
    }
  });
};

export const openTransfer = (app, command, sourceUnits, context, label) => {
  const quantities = Object.fromEntries(Object.keys(sourceUnits).map((id) => [id, 0]));
  app.modal.open({
    title: label,
    body: transferModalBody(sourceUnits, command, label),
    onBind: (card) => {
      card.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
        const id = button.dataset.unit;
        const delta = Number(button.dataset.step);
        const max = Number(button.dataset.max ?? sourceUnits[id]);
        quantities[id] = Math.max(0, Math.min(max, quantities[id] + delta));
        card.querySelector(`[data-quantity="${id}"]`).textContent = quantities[id];
      }));
      card.querySelector('[data-transfer-form]').addEventListener('submit', async (event) => {
        event.preventDefault();
        app.modal.close();
        await app.dispatchPlayer({ type: command, ownerId: PLAYER_ID, units: quantities, ...context });
      });
    }
  });
};

export const openSettings = (app) => {
  const current = app.state.settings.speed;
  app.modal.open({
    title: 'Game settings',
    body: `<div class="form-grid"><div class="field"><label for="speedSetting">Resolution speed</label><select id="speedSetting"><option value="slow" ${current === 'slow' ? 'selected' : ''}>Deliberate</option><option value="normal" ${current === 'normal' ? 'selected' : ''}>Normal</option><option value="fast" ${current === 'fast' ? 'selected' : ''}>Fast</option></select></div><div class="support-item">Even at Fast speed, consequential movement, battle, siege, capture, and economic changes remain visible.</div><button class="large-button" data-save-settings>Save settings</button></div>`,
    onBind: (card) => {
      card.querySelector('[data-save-settings]').addEventListener('click', () => {
        app.state.settings.speed = card.querySelector('#speedSetting').value;
        saveGame(app.state);
        app.modal.close();
        app.toasts.show('Settings saved.', 'success');
      });
    }
  });
};

export const openSaveTools = (app) => {
  const encoded = exportSave(app.state);
  app.modal.open({
    title: 'Save tools',
    body: `<div class="form-grid"><div class="field"><label>Portable save code</label><textarea rows="5" data-save-code style="width:100%;padding:10px;border-radius:10px;background:#202b24;border:1px solid rgba(255,255,255,.12)">${encoded}</textarea></div><div class="action-grid"><button class="action-button primary" data-copy-save><strong>Copy save</strong></button><button class="action-button" data-import-save><strong>Import code</strong></button><button class="action-button danger" data-new-campaign><strong>New campaign</strong><small>Deletes local save</small></button></div></div>`,
    onBind: (card) => {
      card.querySelector('[data-copy-save]').addEventListener('click', async () => {
        await navigator.clipboard.writeText(card.querySelector('[data-save-code]').value);
        app.toasts.show('Save code copied.', 'success');
      });
      card.querySelector('[data-import-save]').addEventListener('click', () => {
        try {
          app.state = importSave(card.querySelector('[data-save-code]').value);
          saveGame(app.state);
          app.modal.close();
          app.selection = { kind: 'overview' };
          app.render();
        } catch (error) { app.toasts.show(error.message, 'error'); }
      });
      card.querySelector('[data-new-campaign]').addEventListener('click', () => { deleteSave(); location.reload(); });
    }
  });
};

export const openHelp = (app) => {
  app.modal.open({
    title: 'Campaign rules',
    body: `<div class="support-list"><div class="support-item"><b>Regions and slots</b><br>Every region has exactly three physical slots. Buildings are captured separately. Empty slots cannot be captured.</div><div class="support-item"><b>Movement</b><br>Select an army, then tap or drag to one directly connected slot. Rivers, forests, hills, wetlands, and mountains alter movement and combat.</div><div class="support-item"><b>Combat information</b><br>You can inspect terrain, fortification, visible garrison size, and supply. The game never displays victory odds or calculated combat power.</div><div class="support-item"><b>Counters</b><br>Archers punish Footmen. Cavalry punishes Archers. Footmen are dependable and expose Siege Trains. Cavalry suffers badly in wetlands and mountains.</div><div class="support-item"><b>Building order</b><br>Taking a City cuts regional supply and income. Taking a Castle cripples regional defense. Taking a Temple yields loot, morale, Fervor, and desertion relief.</div><div class="support-item"><b>Construction</b><br>Instant, but only after all mobile armies leave a secure region. Direct Cities and Castles are costly; upgrades are more efficient.</div><div class="support-item"><b>Gestures</b><br>Drag to pan, pinch to zoom, long-press a slot for full details, swipe the bottom grabber to resize, and drag a selected army directly onto an adjacent slot.</div></div>`
  });
};
