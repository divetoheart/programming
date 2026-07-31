const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export class MapLabUI {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.bind();
  }

  bind() {
    this.root.querySelector('[data-generate]').addEventListener('click', () => this.callbacks.onGenerate(this.seed));
    this.root.querySelector('[data-seed]').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.callbacks.onGenerate(this.seed);
    });
    this.root.querySelector('[data-world]').addEventListener('click', () => this.callbacks.onWorld());
    this.root.querySelector('[data-focus]').addEventListener('click', () => this.callbacks.onFocus());
    this.root.querySelector('[data-mode]').addEventListener('click', (event) => {
      const next = event.currentTarget.dataset.mode === 'terrain' ? 'political' : 'terrain';
      event.currentTarget.dataset.mode = next;
      event.currentTarget.textContent = next === 'terrain' ? 'Terrain' : 'Political';
      this.callbacks.onMode(next);
    });
    this.root.querySelector('[data-tile-list]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-tile-id]');
      if (button) this.callbacks.onTile(Number(button.dataset.tileId));
    });
  }

  get seed() {
    const value = Number(this.root.querySelector('[data-seed]').value);
    return Number.isFinite(value) ? value : Date.now();
  }

  setLoading(loading, message = 'Forging terrain…') {
    const overlay = this.root.querySelector('[data-loading]');
    overlay.classList.toggle('hidden', !loading);
    overlay.querySelector('strong').textContent = message;
  }

  showError(message) {
    this.setLoading(false);
    const error = this.root.querySelector('[data-error]');
    error.textContent = message;
    error.classList.remove('hidden');
  }

  renderSelection(map, selection) {
    const region = map.regions[selection.regionId];
    const tile = map.tiles[selection.tileId];
    this.root.querySelector('[data-region-name]').textContent = region.name;
    this.root.querySelector('[data-region-meta]').textContent = `Region ${region.id + 1} · three connected tiles`;
    this.root.querySelector('[data-selected-terrain]').textContent = titleCase(tile.terrain);
    this.root.querySelector('[data-selected-tile]').textContent = tile.name;
    const holdingByTile = new Map(map.holdings.map((holding) => [holding.tileId, holding]));
    this.root.querySelector('[data-tile-list]').innerHTML = region.tileIds.map((tileId, index) => {
      const entry = map.tiles[tileId];
      const holding = holdingByTile.get(tileId);
      return `<button class="tile-card ${tileId === selection.tileId ? 'selected' : ''}" data-tile-id="${tileId}">
        <span class="tile-number">${index + 1}</span>
        <span><strong>${entry.name}</strong><small>${titleCase(entry.terrain)} · ${holding ? titleCase(holding.type) : 'Open land'}</small></span>
      </button>`;
    }).join('');
  }

  renderStats(map) {
    this.root.querySelector('[data-map-stats]').textContent = `${map.tiles.length} tiles · ${map.regions.length} regions · ${map.rivers.length} river systems`;
  }
}
