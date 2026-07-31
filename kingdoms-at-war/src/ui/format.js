export const formatNumber = (value) => new Intl.NumberFormat('en-US', { notation: Math.abs(value) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(Math.round(value));
export const formatPercent = (value) => `${Math.round(value)}%`;
export const titleCase = (value) => String(value).replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
export const resourceCost = (cost) => Object.entries(cost).filter(([, amount]) => amount).map(([key, amount]) => `${formatNumber(amount)} ${titleCase(key)}`).join(' · ');
