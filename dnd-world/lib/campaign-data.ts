// Compatibility exports for the original prototype. The canonical model now lives
// in types.ts + seed.ts + world.ts.
export * from "./types";
export { createSeedCampaign as createCampaignSeed, CAMPAIGN_SCHEMA_VERSION } from "./seed";
