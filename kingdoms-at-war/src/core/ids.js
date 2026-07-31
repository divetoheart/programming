let counter = 0;
export const makeId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;
export const stableId = (...parts) => parts.join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
