const REGION_COLORS = ['#9a894e', '#8e4f47', '#527b97', '#6f8453', '#796289', '#9a7051', '#547c70', '#7d6e4e', '#53678b', '#7f7950'];

const polygonPath = (ctx, polygon) => {
  ctx.beginPath();
  polygon.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath();
};

export class PoliticalLayer {
  constructor(stack, terrainLayer) {
    this.stack = stack;
    this.terrainLayer = terrainLayer;
  }
  setMap(map) { this.map = map; }

  draw(camera, selection, mode) {
    const { context, canvas } = this.stack.get('politics');
    const dpr = this.stack.dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.x * dpr, camera.y * dpr);
    const showTiles = camera.scale >= 0.43;

    for (const tile of this.map.tiles) {
      const selectedRegion = tile.regionId === selection.regionId;
      const selectedTile = tile.id === selection.tileId;
      polygonPath(context, tile.polygon);
      const base = REGION_COLORS[tile.regionId % REGION_COLORS.length];
      context.fillStyle = selectedTile ? 'rgba(240,202,105,.26)' : selectedRegion ? 'rgba(230,190,94,.12)' : mode === 'political' ? `${base}38` : `${base}13`;
      context.fill();
      if (showTiles) {
        context.strokeStyle = selectedTile ? 'rgba(255,226,143,.95)' : selectedRegion ? 'rgba(226,196,112,.72)' : 'rgba(235,225,197,.33)';
        context.lineWidth = (selectedTile ? 3.4 : selectedRegion ? 2.2 : 1.15) / camera.scale;
        context.stroke();
      }
    }

    for (const segment of this.map.regionBoundaries) {
      const selected = segment.regionId === selection.regionId;
      context.strokeStyle = selected ? 'rgba(255,218,118,.98)' : 'rgba(32,27,19,.86)';
      context.lineWidth = (selected ? 6.6 : 4.2) / camera.scale;
      context.shadowColor = selected ? 'rgba(255,205,80,.68)' : 'transparent';
      context.shadowBlur = selected ? 10 / camera.scale : 0;
      context.beginPath(); context.moveTo(segment.a.x, segment.a.y); context.lineTo(segment.b.x, segment.b.y); context.stroke();
      if (!selected) {
        context.strokeStyle = 'rgba(224,211,175,.46)';
        context.lineWidth = 1.25 / camera.scale;
        context.beginPath(); context.moveTo(segment.a.x, segment.a.y); context.lineTo(segment.b.x, segment.b.y); context.stroke();
      }
    }
    context.shadowBlur = 0;
    this.terrainLayer.applyLandMask(context, camera);
  }
}
