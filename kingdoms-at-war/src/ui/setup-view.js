const COLORS = ['#315f9e', '#8e4037', '#4e7f52', '#79549c', '#a06b2b', '#3e777f', '#7e5b45', '#5d6479', '#8a3560', '#56733a'];
const EMBLEMS = [{ id: 'lion', glyph: '♜' }, { id: 'sun', glyph: '☀' }, { id: 'oak', glyph: '♣' }, { id: 'star', glyph: '✦' }, { id: 'swords', glyph: '⚔' }, { id: 'crown', glyph: '♛' }, { id: 'river', glyph: '≈' }, { id: 'flame', glyph: '♦' }, { id: 'tower', glyph: '▣' }, { id: 'moon', glyph: '☾' }];
const DOMAINS = ['War', 'Harvest', 'Rivers', 'Sky', 'Death', 'Hearth', 'Justice', 'Knowledge', 'Mystery'];
const EMBLEM_GLYPH = Object.fromEntries(EMBLEMS.map((item) => [item.id, item.glyph]));

export const emblemGlyph = (id) => EMBLEM_GLYPH[id] ?? '♛';

export class SetupView {
  constructor(root, { onStart, onLoad, hasSave }) {
    this.root = root;
    this.onStart = onStart;
    this.onLoad = onLoad;
    this.hasSave = hasSave;
    this.color = COLORS[0];
    this.emblem = EMBLEMS[0].id;
  }

  render() {
    this.root.innerHTML = `
      <main class="setup-screen">
        <div class="setup-shell" style="--kingdom-color:${this.color}">
          <div class="setup-crest" data-preview-crest>${emblemGlyph(this.emblem)}</div>
          <h1 class="setup-title">Crown &amp; Conquest</h1>
          <p class="setup-copy">Forge a kingdom and faith, then outmaneuver three rival crowns across a living twenty-region campaign.</p>
          <form class="setup-card" data-setup-form>
            <div class="form-grid">
              <div class="field"><label for="kingdomName">Kingdom</label><input id="kingdomName" name="kingdomName" maxlength="28" value="The Aureate Crown" required></div>
              <div class="field"><label for="rulerName">Ruler</label><input id="rulerName" name="rulerName" maxlength="26" value="King Justin" required></div>
              <div class="field"><label>Banner color</label><div class="color-grid">${COLORS.map((color, index) => `<button class="color-choice ${index === 0 ? 'selected' : ''}" style="--choice:${color}" data-color="${color}" type="button" aria-label="Choose ${color}"></button>`).join('')}</div></div>
              <div class="field"><label>Emblem</label><div class="emblem-grid">${EMBLEMS.map((item, index) => `<button class="emblem-choice ${index === 0 ? 'selected' : ''}" data-emblem="${item.id}" type="button" aria-label="Choose ${item.id}">${item.glyph}</button>`).join('')}</div></div>
              <div class="field"><label for="faithName">Faith</label><input id="faithName" name="faithName" maxlength="28" value="The Radiant Path" required></div>
              <div class="field"><label for="deityName">Deity</label><input id="deityName" name="deityName" maxlength="24" value="Solara" required></div>
              <div class="field"><label for="domain">Divine domain</label><select id="domain" name="domain">${DOMAINS.map((domain) => `<option>${domain}</option>`).join('')}</select></div>
              <div class="field"><label for="seed">World seed</label><input id="seed" name="seed" inputmode="numeric" value="${Math.floor(Date.now() / 1000)}"></div>
            </div>
            <div class="setup-actions">
              <button class="large-button" type="submit">Begin campaign</button>
              ${this.hasSave ? '<button class="large-button secondary" type="button" data-load-game>Continue saved campaign</button>' : ''}
            </div>
          </form>
        </div>
      </main>`;
    this.bind();
  }

  bind() {
    this.root.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => {
      this.color = button.dataset.color;
      this.root.querySelectorAll('[data-color]').forEach((item) => item.classList.toggle('selected', item === button));
      const shell = this.root.querySelector('.setup-shell');
      shell.style.setProperty('--kingdom-color', this.color);
    }));
    this.root.querySelectorAll('[data-emblem]').forEach((button) => button.addEventListener('click', () => {
      this.emblem = button.dataset.emblem;
      this.root.querySelectorAll('[data-emblem]').forEach((item) => item.classList.toggle('selected', item === button));
      this.root.querySelector('[data-preview-crest]').textContent = emblemGlyph(this.emblem);
    }));
    this.root.querySelector('[data-setup-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      this.onStart({
        profile: {
          name: String(data.get('kingdomName')).trim(), ruler: String(data.get('rulerName')).trim(),
          color: this.color, emblem: this.emblem,
          faith: String(data.get('faithName')).trim(), deity: String(data.get('deityName')).trim(),
          domain: data.get('domain'), personality: 'balanced'
        },
        seed: Number(data.get('seed')) || Date.now()
      });
    });
    this.root.querySelector('[data-load-game]')?.addEventListener('click', this.onLoad);
  }
}
