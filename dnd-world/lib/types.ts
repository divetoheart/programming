export type AttributeKey = "might" | "finesse" | "vigor" | "intellect" | "will" | "presence";
export type SkillKey =
  | "athletics" | "blades" | "brawling" | "marksmanship" | "stealth" | "survival"
  | "investigation" | "medicine" | "occult" | "lore" | "insight" | "persuasion"
  | "deception" | "intimidation" | "crafting" | "lockwork";

export type Condition = {
  id: string; name: string; severity: 1 | 2 | 3 | 4 | 5; description: string; expiresAtTurn?: number;
};

export type Wound = {
  id: string; location: string; name: string; severity: 1 | 2 | 3 | 4 | 5; effect: string; treated: boolean;
};

export type InventoryItem = {
  id: string;
  name: string;
  image?: string;
  category: "weapon" | "armor" | "tool" | "consumable" | "quest" | "material" | "currency" | "other";
  quantity: number; weight: number; condition: number; maxCondition: number; value: number; details: string; tags: string[];
};

export type Equipment = {
  mainHand?: string; offHand?: string; armor?: string; head?: string; accessory1?: string; accessory2?: string;
};

export type Character = {
  name: string; epithet: string; image?: string; ancestry: string; calling: string; background: string;
  level: number; xp: number; hp: number; maxHp: number; stamina: number; maxStamina: number;
  resolve: number; maxResolve: number; hunger: number; armor: number; evasion: number; speed: number;
  carryWeight: number; carryMax: number; crowns: number;
  attributes: Record<AttributeKey, number>; skills: Record<SkillKey, number>; languages: Record<string, number>;
  conditions: Condition[]; wounds: Wound[]; equipment: Equipment;
};

export type JournalEntry = { id: string; turn: number; day: number; time: string; title: string; body: string; location: string; tags: string[]; };
export type Memory = { id: string; summary: string; importance: 1 | 2 | 3 | 4 | 5; tags: string[]; createdTurn: number; lastReferencedTurn: number; };
export type Milestone = { id: string; title: string; description: string; status: "hidden" | "active" | "complete" | "failed"; progress: number; target: number; reward: string; };
export type QuestStage = { id: string; title: string; description: string; status: "locked" | "active" | "complete" | "failed"; };
export type Quest = { id: string; title: string; giver: string; summary: string; status: "active" | "complete" | "failed"; currentStage: string; stages: QuestStage[]; rewards: string[]; };

export type NpcState = {
  id: string; name: string; title: string; image?: string; faction: string; location: string;
  status: "alive" | "dead" | "missing" | "unknown";
  relationship: "hostile" | "wary" | "neutral" | "friendly" | "devoted";
  trust: number; fear: number; lastSeenTurn: number; memory: string[];
};

export type FactionState = { id: string; name: string; reputation: number; stance: "hostile" | "unfriendly" | "neutral" | "friendly" | "allied"; publicGoal: string; knownSecret?: string; };
export type LocationState = { id: string; name: string; region: string; x: number; y: number; discovered: boolean; visited: boolean; danger: number; state: string; image: string; };
export type Rumor = { id: string; text: string; source: string; truth: "unknown" | "true" | "false" | "partial"; discoveredTurn: number; };
export type RollResult = { id: string; turn: number; skill: SkillKey; attribute: AttributeKey; die: number; modifier: number; total: number; dc: number; outcome: "critical-failure" | "failure" | "success" | "critical-success"; reason: string; };
export type StoryLog = { id: string; turn: number; kind: "narration" | "mechanic" | "system"; title: string; body: string; location: string; image?: string; createdAt: string; };
export type WorldClock = { day: number; time: string; season: string; weather: string; moon: string; };

export type CampaignState = {
  schemaVersion: number; campaignId: string; campaignName: string; chapter: string; objective: string;
  mapImage?: string;
  turn: number; updatedAt: string;
  world: WorldClock & { region: string; location: string; danger: number; position: { x: number; y: number }; };
  character: Character; inventory: InventoryItem[]; quests: Quest[]; journal: JournalEntry[]; memories: Memory[];
  milestones: Milestone[]; npcs: NpcState[]; factions: FactionState[]; locations: LocationState[]; rumors: Rumor[];
  flags: Record<string, string | number | boolean>; logs: StoryLog[]; lastRoll?: RollResult;
};

export type WorldEffect =
  | { type: "resource"; hpDelta?: number; staminaDelta?: number; resolveDelta?: number; hungerDelta?: number; crownsDelta?: number }
  | { type: "npc"; id: string; trustDelta?: number; fearDelta?: number; relationship?: NpcState["relationship"]; location?: string; status?: NpcState["status"]; memory?: string }
  | { type: "faction"; id: string; reputationDelta?: number; stance?: FactionState["stance"]; knownSecret?: string }
  | { type: "quest"; questId: string; currentStage?: string; questStatus?: Quest["status"]; stageId?: string; stageStatus?: QuestStage["status"] }
  | { type: "location"; id: string; discovered?: boolean; visited?: boolean; movePlayer?: boolean; state?: string }
  | { type: "flag"; key: string; value: string | number | boolean }
  | { type: "inventory_add"; item: InventoryItem }
  | { type: "inventory_remove"; itemId: string; quantity: number }
  | { type: "milestone"; id: string; progressDelta?: number; status?: Milestone["status"] }
  | { type: "language"; id: string; fluencyDelta: number }
  | { type: "objective"; text: string };

export type AppliedEffect = { type: WorldEffect["type"]; summary: string; };
export type ActionRequest = { action: string; state: CampaignState; };
export type ActionResponse = { state: CampaignState; roll?: RollResult; narrative: string; title: string; image: string; mechanicalSummary: string[]; };
