const EPSILON = 1e-7;

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const polygonArea = (polygon) => {
  let area = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
};

export const polygonCentroid = (polygon) => {
  const area = polygonArea(polygon);
  if (Math.abs(area) < EPSILON) {
    return polygon.reduce((sum, point) => ({ x: sum.x + point.x / polygon.length, y: sum.y + point.y / polygon.length }), { x: 0, y: 0 });
  }
  let x = 0;
  let y = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = a.x * b.y - b.x * a.y;
    x += (a.x + b.x) * cross;
    y += (a.y + b.y) * cross;
  }
  return { x: x / (6 * area), y: y / (6 * area) };
};

export const pointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y)) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || EPSILON) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
};

const lineIntersection = (a, b, nx, ny, c) => {
  const da = nx * a.x + ny * a.y - c;
  const db = nx * b.x + ny * b.y - c;
  const t = da / (da - db);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

export const clipPolygonHalfPlane = (polygon, nx, ny, c) => {
  if (!polygon.length) return [];
  const result = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentInside = nx * current.x + ny * current.y <= c + EPSILON;
    const nextInside = nx * next.x + ny * next.y <= c + EPSILON;
    if (currentInside) result.push(current);
    if (currentInside !== nextInside) result.push(lineIntersection(current, next, nx, ny, c));
  }
  return result;
};

export const buildVoronoi = (sites, width, height) => {
  const bounds = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
  return sites.map((site, index) => {
    let polygon = bounds.map((point) => ({ ...point }));
    for (let j = 0; j < sites.length && polygon.length; j += 1) {
      if (j === index) continue;
      const other = sites[j];
      const nx = other.x - site.x;
      const ny = other.y - site.y;
      const c = (other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y) / 2;
      polygon = clipPolygonHalfPlane(polygon, nx, ny, c);
    }
    return polygon;
  });
};

const roundedPoint = (point, precision = 10) => `${Math.round(point.x * precision)},${Math.round(point.y * precision)}`;
const edgeKey = (a, b) => {
  const left = roundedPoint(a);
  const right = roundedPoint(b);
  return left < right ? `${left}|${right}` : `${right}|${left}`;
};

export const deriveAdjacency = (polygons) => {
  const edgeOwners = new Map();
  const adjacency = polygons.map(() => new Set());
  polygons.forEach((polygon, polygonIndex) => {
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      if (distance(a, b) < 1) continue;
      const key = edgeKey(a, b);
      const previous = edgeOwners.get(key);
      if (previous === undefined) edgeOwners.set(key, polygonIndex);
      else {
        adjacency[polygonIndex].add(previous);
        adjacency[previous].add(polygonIndex);
      }
    }
  });
  return { adjacency: adjacency.map((neighbors) => [...neighbors]), edgeOwners };
};

export const regionBoundarySegments = (tiles, adjacency) => {
  const byId = new Map(tiles.map((tile) => [tile.id, tile]));
  const segments = [];
  for (const tile of tiles) {
    const neighborIds = new Set(adjacency[tile.id] ?? []);
    const polygon = tile.polygon;
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      let sameRegionNeighbor = false;
      for (const neighborId of neighborIds) {
        const neighbor = byId.get(neighborId);
        if (!neighbor || neighbor.regionId !== tile.regionId) continue;
        const neighborPolygon = neighbor.polygon;
        for (let j = 0; j < neighborPolygon.length; j += 1) {
          const c = neighborPolygon[j];
          const d = neighborPolygon[(j + 1) % neighborPolygon.length];
          const minX = Math.min(c.x, d.x) - 1;
          const maxX = Math.max(c.x, d.x) + 1;
          const minY = Math.min(c.y, d.y) - 1;
          const maxY = Math.max(c.y, d.y) + 1;
          const cross = Math.abs((d.x - c.x) * (midpoint.y - c.y) - (d.y - c.y) * (midpoint.x - c.x));
          if (cross < 2 && midpoint.x >= minX && midpoint.x <= maxX && midpoint.y >= minY && midpoint.y <= maxY) {
            sameRegionNeighbor = true;
            break;
          }
        }
        if (sameRegionNeighbor) break;
      }
      if (!sameRegionNeighbor) segments.push({ a, b, regionId: tile.regionId });
    }
  }
  return segments;
};

export const smoothPolyline = (points, iterations = 2) => {
  let current = points.map((point) => ({ ...point }));
  for (let pass = 0; pass < iterations; pass += 1) {
    const next = [current[0]];
    for (let i = 0; i < current.length - 1; i += 1) {
      const a = current[i];
      const b = current[i + 1];
      next.push(
        { x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
        { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 },
      );
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
};
