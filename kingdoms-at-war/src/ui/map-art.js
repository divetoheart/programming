const BUILDING_LABELS = {
  village: 'Village',
  city: 'City',
  fortress: 'Fortress',
  castle: 'Castle',
  temple: 'Temple'
};

export const buildingLabel = (type) => BUILDING_LABELS[type] ?? 'Open land';

export const regionPath = ({ x, y }) => [
  `M ${x - 112} ${y - 62}`,
  `Q ${x - 104} ${y - 104} ${x - 54} ${y - 116}`,
  `Q ${x} ${y - 136} ${x + 56} ${y - 114}`,
  `Q ${x + 108} ${y - 101} ${x + 116} ${y - 50}`,
  `L ${x + 108} ${y + 54}`,
  `Q ${x + 88} ${y + 96} ${x + 34} ${y + 112}`,
  `Q ${x - 8} ${y + 129} ${x - 56} ${y + 108}`,
  `Q ${x - 104} ${y + 88} ${x - 116} ${y + 45}`,
  'Z'
].join(' ');

export const mapDefs = () => `
  <defs>
    <linearGradient id="map-sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#172c32"/>
      <stop offset=".55" stop-color="#0f2429"/>
      <stop offset="1" stop-color="#09171b"/>
    </linearGradient>
    <radialGradient id="map-light" cx="50%" cy="34%" r="70%">
      <stop offset="0" stop-color="#fff0bb" stop-opacity=".11"/>
      <stop offset=".6" stop-color="#fff0bb" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="region-plains" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#667452"/><stop offset="1" stop-color="#394a39"/></linearGradient>
    <linearGradient id="region-farmland" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b804c"/><stop offset="1" stop-color="#4d5734"/></linearGradient>
    <linearGradient id="region-forest" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#335b3e"/><stop offset="1" stop-color="#183326"/></linearGradient>
    <linearGradient id="region-hills" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#71684b"/><stop offset="1" stop-color="#403f34"/></linearGradient>
    <linearGradient id="region-mountains" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#696b66"/><stop offset="1" stop-color="#353b3b"/></linearGradient>
    <linearGradient id="region-wetlands" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#426b62"/><stop offset="1" stop-color="#233f3c"/></linearGradient>
    <linearGradient id="region-arid" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#987750"/><stop offset="1" stop-color="#574735"/></linearGradient>
    <linearGradient id="slot-surface" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#26322c"/><stop offset="1" stop-color="#111915"/></linearGradient>
    <filter id="region-shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/>
    </filter>
    <filter id="soft-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="paper-grain" width="19" height="19" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="4" r=".7" fill="#fff" opacity=".08"/><circle cx="13" cy="9" r=".55" fill="#000" opacity=".13"/><circle cx="7" cy="17" r=".45" fill="#fff" opacity=".05"/>
    </pattern>
  </defs>`;

const buildingBase = (content, ownerColor) => `
  <g class="building-art" style="--owner-color:${ownerColor}">
    <ellipse class="building-shadow" cx="0" cy="18" rx="27" ry="8"/>
    ${content}
  </g>`;

export const buildingIllustration = (type, ownerColor = '#d2b46c') => {
  const art = {
    village: `
      <path class="roof" d="M-28 5 L-15 -8 L-2 5 Z"/><rect class="wall" x="-24" y="5" width="18" height="15" rx="2"/>
      <path class="roof" d="M-5 1 L10 -13 L27 1 Z"/><rect class="wall" x="0" y="1" width="22" height="19" rx="2"/>
      <rect class="door" x="8" y="9" width="6" height="11"/><path class="smoke" d="M18 -15 C22 -21 15 -24 20 -30"/>`,
    city: `
      <rect class="wall" x="-27" y="-1" width="54" height="21" rx="3"/><rect class="tower" x="-23" y="-18" width="14" height="38"/>
      <rect class="tower" x="-6" y="-28" width="15" height="48"/><rect class="tower" x="13" y="-12" width="12" height="32"/>
      <path class="roof" d="M-26 -18 L-16 -28 L-6 -18 Z M-10 -28 L2 -39 L13 -28 Z M10 -12 L19 -21 L28 -12 Z"/><rect class="door" x="-1" y="7" width="8" height="13"/>`,
    fortress: `
      <rect class="stone" x="-28" y="-18" width="56" height="38" rx="2"/><path class="battlement" d="M-28 -18 V-27 H-20 V-18 H-10 V-27 H-2 V-18 H8 V-27 H16 V-18 H28 V20 H-28 Z"/>
      <rect class="gate" x="-7" y="4" width="14" height="16" rx="7 7 0 0"/><path class="slit" d="M-17 -9 V0 M17 -9 V0"/>`,
    castle: `
      <rect class="stone" x="-23" y="-15" width="46" height="35"/><rect class="tower" x="-32" y="-24" width="18" height="44"/><rect class="tower" x="14" y="-24" width="18" height="44"/>
      <path class="battlement" d="M-32 -24 V-31 H-26 V-24 H-20 V-31 H-14 V-15 H14 V-31 H20 V-24 H26 V-31 H32 V20 H-32 Z"/>
      <rect class="gate" x="-7" y="4" width="14" height="16" rx="7 7 0 0"/><path class="flag-pole" d="M0 -31 V-45"/><path class="flag" d="M1 -44 H17 L12 -37 H1 Z"/>`,
    temple: `
      <path class="dome" d="M-18 -14 Q0 -35 18 -14 Z"/><rect class="stone" x="-24" y="-14" width="48" height="34"/>
      <path class="pediment" d="M-30 -12 L0 -27 L30 -12 Z"/><path class="column" d="M-20 -10 V16 M-10 -10 V16 M0 -10 V16 M10 -10 V16 M20 -10 V16"/>
      <path class="steps" d="M-30 16 H30 M-34 21 H34"/><circle class="temple-sun" cx="0" cy="-10" r="4"/>`
  }[type];
  return buildingBase(art ?? '', ownerColor);
};

export const emptySlotIllustration = (terrain) => {
  const terrainArt = {
    plains: '<path class="landmark" d="M-24 14 Q-10 -1 2 12 Q13 -7 27 13"/>',
    farmland: '<path class="landmark" d="M-25 13 L24 -8 M-23 4 L20 -14 M-16 18 L28 -1"/>',
    forest: '<path class="landmark" d="M-22 16 L-12 -8 L-2 16 M-6 16 L6 -14 L18 16 M10 16 L20 -4 L29 16"/>',
    hills: '<path class="landmark" d="M-28 16 Q-12 -14 3 16 Q16 -7 29 16"/>',
    mountains: '<path class="landmark" d="M-29 17 L-10 -18 L2 2 L13 -12 L30 17 Z"/>',
    wetlands: '<path class="landmark" d="M-28 3 Q-15 -4 -2 3 T24 3 M-23 13 Q-10 6 3 13 T28 13"/>',
    arid: '<path class="landmark" d="M-26 14 Q-8 -6 9 13 Q18 4 29 14 M3 8 V-10 M-3 -5 H9"/>'
  }[terrain] ?? '';
  return `<g class="empty-art">${terrainArt}<circle class="build-plus" cx="23" cy="-20" r="10"/><path class="plus-mark" d="M18 -20 H28 M23 -25 V-15"/></g>`;
};

export const terrainDecoration = (region) => {
  const x = region.x;
  const y = region.y;
  const variant = region.index % 4;
  const common = `<path class="terrain-contour" d="M${x - 88} ${y + 78 - variant * 5} Q${x - 25} ${y + 52} ${x + 82} ${y + 77}"/>`;
  const art = {
    forest: `<g class="terrain-silhouette"><path d="M${x - 95} ${y - 56} l12 -24 12 24z M${x + 70} ${y - 61} l13 -27 13 27z M${x + 86} ${y + 45} l10 -22 10 22z"/></g>`,
    mountains: `<g class="terrain-silhouette"><path d="M${x - 102} ${y + 36} l34 -64 20 31 27 -48 42 81z"/></g>`,
    wetlands: `<g class="water-lines"><path d="M${x - 92} ${y - 48} q25 10 50 0 t50 0 M${x - 75} ${y + 72} q24 10 48 0 t48 0"/></g>`,
    farmland: `<g class="field-lines"><path d="M${x - 94} ${y + 64} L${x - 16} ${y + 28} M${x - 72} ${y + 80} L${x + 4} ${y + 45} M${x + 32} ${y - 78} L${x + 92} ${y - 42}"/></g>`,
    arid: `<g class="dune-lines"><path d="M${x - 100} ${y + 55} q37 -31 75 0 t75 0 M${x - 70} ${y - 68} q28 -20 58 0"/></g>`,
    hills: `<g class="hill-lines"><path d="M${x - 102} ${y + 61} Q${x - 48} ${y - 10} ${x + 8} ${y + 61} Q${x + 52} ${y + 8} ${x + 103} ${y + 61}"/></g>`,
    plains: `<g class="grass-lines"><path d="M${x - 88} ${y + 70} l5 -15 m4 15 l3 -11 m105 -92 l5 -13 m-1 13 l10 -10"/></g>`
  }[region.terrain] ?? '';
  return `${common}${art}`;
};
