const ownerColors = ['#c8a44b', '#8d4b40', '#456d91', '#6d7c46'];

export const drawTree = (ctx, feature, lod) => {
  const s = feature.scale * (lod > 1 ? 1 : 0.85);
  ctx.save();
  ctx.translate(feature.x, feature.y);
  ctx.scale(s, s);
  const tones = [['#233e2b', '#31583a'], ['#294830', '#3b6543'], ['#1f3728', '#2f5136']];
  const [dark, light] = tones[feature.tone] ?? tones[0];
  ctx.fillStyle = 'rgba(16,20,16,.36)';
  ctx.beginPath(); ctx.ellipse(4, 7, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-8, 4); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.moveTo(-1, -9); ctx.lineTo(-5, 0); ctx.lineTo(3, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4b3724'; ctx.fillRect(-1.2, 3, 2.4, 6);
  ctx.restore();
};

export const drawMountain = (ctx, feature) => {
  const s = 18 * feature.scale;
  ctx.save();
  ctx.translate(feature.x, feature.y);
  ctx.fillStyle = 'rgba(18,20,18,.42)';
  ctx.beginPath(); ctx.ellipse(5, 7, s * 0.85, s * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5f5b50';
  ctx.beginPath(); ctx.moveTo(-s, s * 0.45); ctx.lineTo(0, -s); ctx.lineTo(s, s * 0.45); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#827c6e';
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 0.45); ctx.lineTo(-s, s * 0.45); ctx.closePath(); ctx.fill();
  if (feature.elevation > 0.92) {
    ctx.fillStyle = '#dedbd1';
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(-s * 0.25, -s * 0.55); ctx.lineTo(0, -s * 0.67); ctx.lineTo(s * 0.2, -s * 0.5); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};

export const drawFarm = (ctx, feature) => {
  ctx.save();
  ctx.translate(feature.x, feature.y);
  ctx.rotate(feature.rotation);
  ctx.scale(feature.scale, feature.scale);
  ctx.fillStyle = 'rgba(160,143,69,.24)';
  ctx.fillRect(-20, -9, 40, 18);
  ctx.strokeStyle = 'rgba(207,185,100,.32)';
  ctx.lineWidth = 1;
  for (let y = -7; y <= 7; y += 4) {
    ctx.beginPath(); ctx.moveTo(-18, y); ctx.lineTo(18, y); ctx.stroke();
  }
  ctx.restore();
};

const drawBanner = (ctx, ownerId, x, y, scale = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#302719'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -25); ctx.stroke();
  ctx.fillStyle = ownerColors[ownerId % ownerColors.length];
  ctx.beginPath(); ctx.moveTo(1, -23); ctx.lineTo(17, -18); ctx.lineTo(1, -10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(238,216,151,.8)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
};

export const drawHolding = (ctx, holding, tile, selected = false) => {
  const x = tile.site.x;
  const y = tile.site.y;
  const scale = selected ? 1.14 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = 'rgba(14,17,14,.46)';
  ctx.beginPath(); ctx.ellipse(0, 16, 29, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  if (holding.type === 'village') {
    for (const [dx, dy, size] of [[-14,2,12],[2,-4,14],[15,4,10],[-2,10,11]]) {
      ctx.fillStyle = '#b69a6d'; ctx.fillRect(dx - size/2, dy - size/2, size, size * .7);
      ctx.fillStyle = '#6b3f2c'; ctx.beginPath(); ctx.moveTo(dx-size*.6,dy-size/2); ctx.lineTo(dx,dy-size); ctx.lineTo(dx+size*.6,dy-size/2); ctx.closePath(); ctx.fill();
    }
  } else if (holding.type === 'temple') {
    ctx.fillStyle = '#d2c6a3'; ctx.fillRect(-19, -4, 38, 22);
    ctx.beginPath(); ctx.moveTo(-24,-4); ctx.lineTo(0,-25); ctx.lineTo(24,-4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8c7a55'; ctx.fillRect(-4, 5, 8, 13);
    ctx.strokeStyle = '#e5d6a8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(0,-39); ctx.moveTo(-5,-34); ctx.lineTo(5,-34); ctx.stroke();
  } else if (holding.type === 'city') {
    ctx.fillStyle = '#a58d66';
    for (const [dx,dy,w,h] of [[-23,0,15,22],[-6,-8,18,30],[14,-2,17,24],[0,9,20,15]]) ctx.fillRect(dx-w/2,dy-h/2,w,h);
    ctx.strokeStyle = '#6f5a3e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 5, 31, Math.PI, Math.PI*2); ctx.stroke();
  } else {
    const castle = holding.type === 'castle';
    ctx.fillStyle = castle ? '#b7ad99' : '#989184';
    ctx.fillRect(-23, -5, 46, 27);
    for (const dx of [-23, 0, 23]) {
      ctx.fillRect(dx - 7, -26, 14, 40);
      for (let i = -6; i <= 6; i += 6) ctx.fillRect(dx + i - 2, -31, 4, 8);
    }
    ctx.fillStyle = '#463d32'; ctx.fillRect(-5, 7, 10, 15);
    if (castle) {
      ctx.fillStyle = '#d0c5af'; ctx.fillRect(-9, -37, 18, 18);
      ctx.fillStyle = '#463d32'; ctx.fillRect(-2, -31, 4, 8);
    }
  }
  ctx.restore();
  drawBanner(ctx, holding.ownerId, x + 24, y - 8, selected ? 1.06 : 0.9);
};

export const drawArmy = (ctx, army) => {
  ctx.save();
  ctx.translate(army.x, army.y);
  ctx.fillStyle = 'rgba(14,16,14,.5)';
  ctx.beginPath(); ctx.ellipse(0, 12, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3328';
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath(); ctx.arc(i * 7, Math.abs(i) * 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8a886'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(i*7,4); ctx.lineTo(i*7,12); ctx.stroke();
  }
  ctx.restore();
  drawBanner(ctx, army.ownerId, army.x + 8, army.y - 7, 0.78);
};
