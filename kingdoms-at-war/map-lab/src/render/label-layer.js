export class LabelLayer {
  constructor(stack) { this.stack = stack; }
  setMap(map) { this.map = map; }

  draw(camera, selection) {
    const { context, canvas } = this.stack.get('labels');
    const dpr = this.stack.dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.x * dpr, camera.y * dpr);
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (const region of this.map.regions) {
      if (camera.scale > 0.88 && region.id !== selection.regionId) continue;
      const selected = region.id === selection.regionId;
      context.font = `${selected ? 700 : 600} ${selected ? 34 : camera.scale < 0.5 ? 31 : 22}px Georgia, serif`;
      context.lineWidth = selected ? 7 : 5;
      context.strokeStyle = 'rgba(16,17,14,.88)';
      context.fillStyle = selected ? '#f7df9b' : '#ede1c3';
      context.strokeText(region.name, region.center.x, region.center.y - (selected ? 58 : 0));
      context.fillText(region.name, region.center.x, region.center.y - (selected ? 58 : 0));
    }

    if (camera.scale > 0.88) {
      for (const tile of this.map.tiles) {
        if (tile.regionId !== selection.regionId) continue;
        context.font = '600 13px system-ui, sans-serif';
        context.lineWidth = 4;
        context.strokeStyle = 'rgba(13,15,12,.9)';
        context.fillStyle = '#f6ead0';
        context.strokeText(tile.name, tile.site.x, tile.site.y + 55);
        context.fillText(tile.name, tile.site.x, tile.site.y + 55);
      }
    }
  }
}
