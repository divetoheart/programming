export type Ability = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
export type LogKind = "prompt" | "response" | "roll" | "attack" | "system";

export type Character = {
  name: string;
  className: string;
  level: number;
  ancestry: string;
  background: string;
  hp: number;
  maxHp: number;
  armorClass: number;
  speed: number;
  proficiency: number;
  xp: number;
  abilities: Record<Ability, number>;
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  details: string;
};

export type CampaignLog = {
  id: string;
  kind: LogKind;
  title: string;
  body: string;
  createdAt: string;
};

export type CampaignState = {
  campaignName: string;
  chapter: string;
  location: string;
  objective: string;
  character: Character;
  inventory: InventoryItem[];
  notes: string;
  journal: string;
  quests: { id: string; title: string; status: "active" | "complete"; details: string }[];
  party: { id: string; name: string; role: string; hp: number; maxHp: number }[];
  enemies: { id: string; name: string; hp: number; maxHp: number; armorClass: number }[];
  logs: CampaignLog[];
};

export type StoredCampaign = {
  dataVersion: number;
  state: CampaignState;
};

export const STORAGE_KEY = "living-campaign-v2";
export const CAMPAIGN_DATA_VERSION = 1;

export function createCampaignSeed(): CampaignState {
  return {
    campaignName: "The Ember Road",
    chapter: "Chapter I — Ash at the Crossing",
    location: "Greywake Ferry",
    objective: "Learn why the eastern beacon went dark.",
    character: {
      name: "Mara Vey",
      className: "Ranger",
      level: 3,
      ancestry: "Human",
      background: "Wanderer",
      hp: 24,
      maxHp: 28,
      armorClass: 15,
      speed: 30,
      proficiency: 2,
      xp: 760,
      abilities: { STR: 12, DEX: 16, CON: 14, INT: 10, WIS: 15, CHA: 9 },
    },
    inventory: [
      { id: "i1", name: "Longbow", quantity: 1, details: "1d8 piercing · range 150/600" },
      { id: "i2", name: "Arrows", quantity: 18, details: "A weathered leather quiver" },
      { id: "i3", name: "Healing Potion", quantity: 2, details: "Restore 2d4 + 2 HP" },
      { id: "i4", name: "Black Iron Key", quantity: 1, details: "Warm near the eastern road" },
    ],
    notes: "The ferryman saw blue fire beyond the tree line. Captain Sorn refuses to send guards east.",
    journal: "Rain followed us into Greywake. The river is too high, and something has marked every door with soot.",
    quests: [
      { id: "q1", title: "The Darkened Beacon", status: "active", details: "Reach the eastern watchtower." },
      { id: "q2", title: "Ferryman's Debt", status: "active", details: "Recover Hallen's missing satchel." },
    ],
    party: [
      { id: "p1", name: "Mara Vey", role: "Ranger", hp: 24, maxHp: 28 },
      { id: "p2", name: "Brother Edrin", role: "Cleric", hp: 19, maxHp: 22 },
    ],
    enemies: [{ id: "e1", name: "Soot Wolf", hp: 11, maxHp: 11, armorClass: 13 }],
    logs: [
      {
        id: "l1",
        kind: "response",
        title: "Dungeon Master",
        body: "The wolf circles just beyond the lantern light. Its breath carries sparks, but it has not attacked.",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Lightweight publishing path for future campaign changes.
 *
 * To publish a new canonical event without editing the UI:
 * 1. Increase CAMPAIGN_DATA_VERSION.
 * 2. Add a migration below for that version.
 * 3. Change only the fields affected by the event.
 *
 * Local player edits remain intact unless a migration deliberately changes them.
 */
export function applyPublishedUpdates(state: CampaignState, fromVersion: number): CampaignState {
  let next = state;

  // Example for the next update:
  // if (fromVersion < 2) {
  //   next = {
  //     ...next,
  //     chapter: "Chapter II — The Eastern Flame",
  //     location: "Eastern Beacon",
  //     journal: `${next.journal}\n\nWe reached the beacon at dusk.`,
  //     logs: [
  //       {
  //         id: "published-v2",
  //         kind: "response",
  //         title: "Dungeon Master",
  //         body: "The beacon ignites as the iron key turns in its lock.",
  //         createdAt: new Date().toISOString(),
  //       },
  //       ...next.logs,
  //     ],
  //   };
  // }

  return next;
}
