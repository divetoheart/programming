import { drawTree, drawMountain, drawFarm, drawHolding, drawArmy } from './sprite-art.js';

const visibleBounds = (camera, width, height, margin = 80) => ({
  left: (-camera.x) / camera.scale - margin,
  top: (-camera.y) / camera.scale - margin,
  right: (width - camera.x) / camera.scale + margin,
  bottom: (height - camera.y) / camera.scale + margin,
});
const visible = (point, bounds) => point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;

export class FeatureLayer {
  constructor(stack) { this.stack = stack; }
  setMap(map) {
    this.map = map;
    this.holdingByTile = new Map(map.holdings.map((holding) => [holding.tileId, holding]));
    this.tileById = new Map(map.tiles.map((tile) => [tile.id, tile]));
    this.armies = map.holdings.filter((_, index) => index % 7 === 2).map((holding, index) => {
      const tile = this.tileById.get(holding.tileId);
      return { x: tile.site.x + 38, y: tile.site.y + 28, ownerId: (holding.ownerId + 1 + index) % 4 };
    });
  }

  draw(camera, selection) {
    const { context, canvas } = this.stack.get('features');
    const dpr = this.stack.dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.x * dpr, camera.y * dpr);
    const bounds = visibleBounds(camera, this.stack.width, this.stack.height);
    const lod = camera.scale > 0.78 ? 2 : camera.scale > 0.48 ? 1 : 0;

    for (const farm of this.map.features.farms) if (visible(farm, bounds) && lod > 0) drawFarm(context, farm);

    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const river of this.map.rivers) {
      if (!river.some((point) => visible(point, bounds))) continue;
      context.strokeStyle = 'rgba(15,35,44,.46)';
      context.lineWidth = (river[river.length - 1]?.width ?? 5) + 4;
      context.beginPath();
      river.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.stroke();
      context.strokeStyle = 'rgba(63,112,126,.9)';
      context.lineWidth = river[river.length - 1]?.width ?? 5;
      context.stroke();
      context.strokeStyle = 'rgba(177,205,201,.24)';
      context.lineWidth = 1.2;
      context.stroke();
    }

    for (const road of this.map.roads) {
      const middle = road.via;
      if (!visible(middle, bounds)) continue;
      context.strokeStyle = road.major ? 'rgba(81,59,37,.72)' : 'rgba(92,70,45,.54)';
      context.lineWidth = road.major ? 4.2 : 2.4;
      context.setLineDash(road.major ? [] : [7, 5]);
      context.beginPath();
      context.moveTo(road.from.x, road.from.y);
      context.quadraticCurveTo(road.via.x, road.via.y, road.to.x, road.to.y);
      context.stroke();
    }
    context.setLineDash([]);

    if (lod > 0) for (const tree of this.map.features.forests) if (visible(tree, bounds)) drawTree(context, tree, lod);
    for (const mountain of this.map.features.mountains) if (visible(mountain, bounds)) drawMountain(context, mountain);

    if (lod > 0) {
      for (const holding of this.map.holdings) {
        const tile = this.tileById.get(holding.tileId);
        if (visible(tile.site, bounds)) drawHolding(context, holding, tile, selection.tileId === tile.id);
      }
      for (const army of this.armies) if (visible(army, bounds)) drawArmy(context, army);
    }
  }
}
