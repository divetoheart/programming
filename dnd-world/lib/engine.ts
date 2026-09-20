import type {
  AppliedEffect,
  AttributeKey,
  CampaignState,
  JournalEntry,
  Memory,
  RollResult,
  SkillKey,
  WorldEffect,
} from "./types";

type CheckProfile = {
  skill: SkillKey;
  attribute: AttributeKey;
  dc: number;
  staminaCost: number;
  resolveCost: number;
  minutes: number;
  reason: string;
};

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function inferCheck(state: CampaignState, action: string): CheckProfile {
  const a = action.toLowerCase();
  const danger = state.world.danger;

  if (hasAny(a, ["shoot", "bow", "fire", "throw", "aim"])) {
    return { skill: "marksmanship", attribute: "finesse", dc: 10 + danger, staminaCost: 2, resolveCost: 0, minutes: 1, reason: "Ranged attack" };
  }
  if (hasAny(a, ["attack", "slash", "stab", "strike", "sabre", "sword", "blade"])) {
    return { skill: "blades", attribute: "finesse", dc: 10 + danger, staminaCost: 2, resolveCost: 0, minutes: 1, reason: "Melee attack" };
  }
  if (hasAny(a, ["sneak", "hide", "quiet", "shadow", "creep"])) {
    return { skill: "stealth", attribute: "finesse", dc: 10 + danger, staminaCost: 1, resolveCost: 0, minutes: 10, reason: "Stealth" };
  }
  if (hasAny(a, ["track", "forage", "navigate", "travel", "road", "trail", "camp"])) {
    return { skill: "survival", attribute: "will", dc: 9 + danger, staminaCost: 2, resolveCost: 0, minutes: 120, reason: "Travel and survival" };
  }
  if (hasAny(a, ["inspect", "search", "examine", "investigate", "look for", "study"])) {
    return { skill: "investigation", attribute: "intellect", dc: 10 + danger, staminaCost: 0, resolveCost: 0, minutes: 15, reason: "Investigation" };
  }
  if (hasAny(a, ["heal", "bandage", "treat", "medicine", "stitch"])) {
    return { skill: "medicine", attribute: "intellect", dc: 11, staminaCost: 0, resolveCost: 0, minutes: 20, reason: "Medicine" };
  }
  if (hasAny(a, ["ritual", "magic", "spell", "sigil", "threnody", "spirit", "curse"])) {
    return { skill: "occult", attribute: "will", dc: 12 + danger, staminaCost: 0, resolveCost: 3, minutes: 15, reason: "Occult working" };
  }
  if (hasAny(a, ["remember", "history", "translate", "language", "read", "lore"])) {
    return { skill: "lore", attribute: "intellect", dc: 11 + Math.floor(danger / 2), staminaCost: 0, resolveCost: 0, minutes: 10, reason: "Lore" };
  }
  if (hasAny(a, ["persuade", "convince", "reason", "negotiate", "ask nicely"])) {
    return { skill: "persuasion", attribute: "presence", dc: 10 + danger, staminaCost: 0, resolveCost: 0, minutes: 8, reason: "Persuasion" };
  }
  if (hasAny(a, ["lie", "deceive", "bluff", "pretend"])) {
    return { skill: "deception", attribute: "presence", dc: 11 + danger, staminaCost: 0, resolveCost: 0, minutes: 5, reason: "Deception" };
  }
  if (hasAny(a, ["threaten", "intimidate", "menace"])) {
    return { skill: "intimidation", attribute: "presence", dc: 10 + danger, staminaCost: 0, resolveCost: 1, minutes: 5, reason: "Intimidation" };
  }
  if (hasAny(a, ["pick", "lock", "disable trap", "mechanism"])) {
    return { skill: "lockwork", attribute: "finesse", dc: 11 + danger, staminaCost: 0, resolveCost: 0, minutes: 10, reason: "Lockwork" };
  }
  if (hasAny(a, ["climb", "jump", "swim", "lift", "force", "break"])) {
    return { skill: "athletics", attribute: "might", dc: 10 + danger, staminaCost: 2, resolveCost: 0, minutes: 5, reason: "Athletics" };
  }
  return { skill: "insight", attribute: "will", dc: 9 + danger, staminaCost: 0, resolveCost: 0, minutes: 8, reason: "General action" };
}

export function rollAction(state: CampaignState, action: string): { roll: RollResult; profile: CheckProfile } {
  const profile = inferCheck(state, action);
  const die = Math.floor(Math.random() * 20) + 1;
  const attribute = abilityModifier(state.character.attributes[profile.attribute]);
  const skill = state.character.skills[profile.skill];
  const modifier = attribute + skill;
  const total = die + modifier;
  const outcome: RollResult["outcome"] =
    die === 1 ? "critical-failure" :
    die === 20 ? "critical-success" :
    total >= profile.dc ? "success" : "failure";

  return {
    profile,
    roll: {
      id: "roll-" + state.turn + "-" + Date.now(),
      turn: state.turn + 1,
      skill: profile.skill,
      attribute: profile.attribute,
      die,
      modifier,
      total,
      dc: profile.dc,
      outcome,
      reason: profile.reason,
    },
  };
}

function parseTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(total: number) {
  const normalized = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function updateClock(state: CampaignState, minutes: number) {
  const current = parseTime(state.world.time);
  const total = current + minutes;
  return {
    day: state.world.day + Math.floor(total / 1440),
    time: formatTime(total),
  };
}

function touchMemories(memories: Memory[], action: string, turn: number) {
  const lower = action.toLowerCase();
  return memories.map((memory) => {
    const hit = memory.tags.some((tag) => lower.includes(tag.replaceAll("-", " "))) ||
      memory.summary.toLowerCase().split(/\W+/).filter((word) => word.length > 5).some((word) => lower.includes(word));
    return hit ? { ...memory, lastReferencedTurn: turn } : memory;
  });
}

export function applyMechanicalTurn(
  state: CampaignState,
  action: string,
  roll: RollResult,
  profile: CheckProfile,
): { state: CampaignState; mechanicalSummary: string[] } {
  const nextTurn = state.turn + 1;
  const lower = action.toLowerCase();
  const clock = updateClock(state, profile.minutes);
  let hp = state.character.hp;
  let stamina = Math.max(0, state.character.stamina - profile.staminaCost);
  let resolve = Math.max(0, state.character.resolve - profile.resolveCost);
  let hunger = Math.min(100, state.character.hunger + Math.max(1, Math.floor(profile.minutes / 60)));
  let inventory = state.inventory.map((item) => ({ ...item }));
  const summary: string[] = [];

  if (profile.staminaCost) summary.push("-" + profile.staminaCost + " stamina");
  if (profile.resolveCost) summary.push("-" + profile.resolveCost + " resolve");

  if (hasAny(lower, ["rest", "sleep"])) {
    const extra = updateClock({ ...state, world: { ...state.world, day: clock.day, time: clock.time } }, 480);
    clock.day = extra.day;
    clock.time = extra.time;
    stamina = state.character.maxStamina;
    resolve = Math.min(state.character.maxResolve, state.character.resolve + 3);
    hunger = Math.min(100, hunger + 18);
    summary.push("Stamina restored", "+3 resolve", "8 hours pass");
  }

  if (hasAny(lower, ["eat", "ration", "food"])) {
    const foodIndex = inventory.findIndex((item) => item.tags.includes("food") && item.quantity > 0);
    if (foodIndex >= 0) {
      inventory[foodIndex].quantity -= 1;
      hunger = Math.max(0, hunger - 35);
      summary.push("Consumed 1 ration", "-35 hunger");
      inventory = inventory.filter((item) => item.quantity > 0);
    }
  }

  if (roll.outcome === "critical-failure" && state.world.danger >= 3) {
    hp = Math.max(0, hp - 2);
    summary.push("-2 HP from a dangerous complication");
  }

  if (hunger >= 80) {
    stamina = Math.min(stamina, Math.max(1, state.character.maxStamina - 4));
    summary.push("Severe hunger caps stamina");
  }

  const journalEntry: JournalEntry = {
    id: "journal-" + nextTurn + "-" + Date.now(),
    turn: nextTurn,
    day: clock.day,
    time: clock.time,
    title: profile.reason + " — " + roll.outcome.replace("-", " "),
    body: "I chose to " + action.trim() + ". " + profile.skill + " check: " + roll.total + " vs DC " + roll.dc + ".",
    location: state.world.location,
    tags: [profile.skill, roll.outcome, state.world.location.toLowerCase().replaceAll(" ", "-")],
  };

  const next: CampaignState = {
    ...state,
    turn: nextTurn,
    updatedAt: new Date().toISOString(),
    world: {
      ...state.world,
      day: clock.day,
      time: clock.time,
    },
    character: {
      ...state.character,
      hp,
      stamina,
      resolve,
      hunger,
    },
    inventory,
    journal: [journalEntry, ...state.journal].slice(0, 300),
    memories: touchMemories(state.memories, action, nextTurn),
    lastRoll: roll,
  };

  return { state: next, mechanicalSummary: summary };
}


function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeDelta(value: unknown, limit: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(Math.trunc(value), -limit, limit)
    : 0;
}

export function applyWorldEffects(
  state: CampaignState,
  proposed: unknown,
): { state: CampaignState; applied: AppliedEffect[] } {
  if (!Array.isArray(proposed)) return { state, applied: [] };

  let next: CampaignState = {
    ...state,
    character: { ...state.character, languages: { ...state.character.languages } },
    inventory: state.inventory.map((item) => ({ ...item, tags: [...item.tags] })),
    quests: state.quests.map((quest) => ({ ...quest, stages: quest.stages.map((stage) => ({ ...stage })) })),
    npcs: state.npcs.map((npc) => ({ ...npc, memory: [...npc.memory] })),
    factions: state.factions.map((faction) => ({ ...faction })),
    locations: state.locations.map((location) => ({ ...location })),
    milestones: state.milestones.map((milestone) => ({ ...milestone })),
    flags: { ...state.flags },
  };
  const applied: AppliedEffect[] = [];

  for (const candidate of proposed.slice(0, 12)) {
    if (!candidate || typeof candidate !== "object") continue;
    const effect = candidate as Partial<WorldEffect> & Record<string, unknown>;
    const type = effect.type;

    if (type === "resource") {
      const hpDelta = safeDelta(effect.hpDelta, 20);
      const staminaDelta = safeDelta(effect.staminaDelta, 20);
      const resolveDelta = safeDelta(effect.resolveDelta, 10);
      const hungerDelta = safeDelta(effect.hungerDelta, 40);
      const crownsDelta = safeDelta(effect.crownsDelta, 200);
      next.character = {
        ...next.character,
        hp: clamp(next.character.hp + hpDelta, 0, next.character.maxHp),
        stamina: clamp(next.character.stamina + staminaDelta, 0, next.character.maxStamina),
        resolve: clamp(next.character.resolve + resolveDelta, 0, next.character.maxResolve),
        hunger: clamp(next.character.hunger + hungerDelta, 0, 100),
        crowns: Math.max(0, next.character.crowns + crownsDelta),
      };
      const bits = [
        hpDelta ? (hpDelta > 0 ? "+" : "") + hpDelta + " HP" : "",
        staminaDelta ? (staminaDelta > 0 ? "+" : "") + staminaDelta + " stamina" : "",
        resolveDelta ? (resolveDelta > 0 ? "+" : "") + resolveDelta + " resolve" : "",
        hungerDelta ? (hungerDelta > 0 ? "+" : "") + hungerDelta + " hunger" : "",
        crownsDelta ? (crownsDelta > 0 ? "+" : "") + crownsDelta + " crowns" : "",
      ].filter(Boolean);
      if (bits.length) applied.push({ type, summary: bits.join(", ") });
      continue;
    }

    if (type === "npc" && typeof effect.id === "string") {
      const index = next.npcs.findIndex((npc) => npc.id === effect.id);
      if (index < 0) continue;
      const npc = next.npcs[index];
      const trustDelta = safeDelta(effect.trustDelta, 25);
      const fearDelta = safeDelta(effect.fearDelta, 25);
      const relationships = ["hostile", "wary", "neutral", "friendly", "devoted"];
      const statuses = ["alive", "dead", "missing", "unknown"];
      const relationship = typeof effect.relationship === "string" && relationships.includes(effect.relationship)
        ? effect.relationship as typeof npc.relationship
        : npc.relationship;
      const status = typeof effect.status === "string" && statuses.includes(effect.status)
        ? effect.status as typeof npc.status
        : npc.status;
      const memory = typeof effect.memory === "string" ? effect.memory.trim().slice(0, 400) : "";
      const location = typeof effect.location === "string" && effect.location.trim()
        ? effect.location.trim().slice(0, 100)
        : npc.location;
      next.npcs[index] = {
        ...npc,
        trust: clamp(npc.trust + trustDelta, -100, 100),
        fear: clamp(npc.fear + fearDelta, 0, 100),
        relationship,
        status,
        location,
        lastSeenTurn: next.turn,
        memory: memory ? [memory, ...npc.memory].slice(0, 40) : npc.memory,
      };
      applied.push({ type, summary: npc.name + " state updated" });
      continue;
    }

    if (type === "faction" && typeof effect.id === "string") {
      const index = next.factions.findIndex((faction) => faction.id === effect.id);
      if (index < 0) continue;
      const faction = next.factions[index];
      const stances = ["hostile", "unfriendly", "neutral", "friendly", "allied"];
      const stance = typeof effect.stance === "string" && stances.includes(effect.stance)
        ? effect.stance as typeof faction.stance
        : faction.stance;
      const knownSecret = typeof effect.knownSecret === "string" && effect.knownSecret.trim()
        ? effect.knownSecret.trim().slice(0, 500)
        : faction.knownSecret;
      next.factions[index] = {
        ...faction,
        reputation: clamp(faction.reputation + safeDelta(effect.reputationDelta, 20), -100, 100),
        stance,
        knownSecret,
      };
      applied.push({ type, summary: faction.name + " reputation/state updated" });
      continue;
    }

    if (type === "quest" && typeof effect.questId === "string") {
      const index = next.quests.findIndex((quest) => quest.id === effect.questId);
      if (index < 0) continue;
      const quest = next.quests[index];
      const questStatuses = ["active", "complete", "failed"];
      const stageStatuses = ["locked", "active", "complete", "failed"];
      const questStatus = typeof effect.questStatus === "string" && questStatuses.includes(effect.questStatus)
        ? effect.questStatus as typeof quest.status
        : quest.status;
      const stages = quest.stages.map((stage) => {
        if (stage.id !== effect.stageId) return stage;
        const stageStatus = typeof effect.stageStatus === "string" && stageStatuses.includes(effect.stageStatus)
          ? effect.stageStatus as typeof stage.status
          : stage.status;
        return { ...stage, status: stageStatus };
      });
      const requestedStage = typeof effect.currentStage === "string" ? effect.currentStage : "";
      const currentStage = stages.some((stage) => stage.id === requestedStage) ? requestedStage : quest.currentStage;
      next.quests[index] = { ...quest, status: questStatus, stages, currentStage };
      applied.push({ type, summary: quest.title + " progressed" });
      continue;
    }

    if (type === "location" && typeof effect.id === "string") {
      const index = next.locations.findIndex((location) => location.id === effect.id);
      if (index < 0) continue;
      const location = next.locations[index];
      const discovered = effect.discovered === true ? true : location.discovered;
      const visited = effect.visited === true ? true : location.visited;
      const locationState = typeof effect.state === "string" && effect.state.trim()
        ? effect.state.trim().slice(0, 500)
        : location.state;
      next.locations[index] = { ...location, discovered, visited, state: locationState };
      if (effect.movePlayer === true && discovered) {
        next.world = {
          ...next.world,
          location: location.name,
          region: location.region,
          danger: location.danger,
          position: { x: location.x, y: location.y },
        };
        next.locations[index] = { ...next.locations[index], visited: true };
      }
      applied.push({ type, summary: effect.movePlayer === true ? "Moved to " + location.name : location.name + " updated" });
      continue;
    }

    if (type === "flag" && typeof effect.key === "string" && effect.key.length <= 80) {
      if (["string", "number", "boolean"].includes(typeof effect.value)) {
        next.flags[effect.key] = effect.value as string | number | boolean;
        applied.push({ type, summary: "World flag " + effect.key + " updated" });
      }
      continue;
    }

    if (type === "inventory_remove" && typeof effect.itemId === "string") {
      const index = next.inventory.findIndex((item) => item.id === effect.itemId);
      if (index < 0) continue;
      const quantity = clamp(Math.trunc(Number(effect.quantity) || 0), 1, 20);
      const item = next.inventory[index];
      const removed = Math.min(quantity, item.quantity);
      next.inventory[index] = { ...item, quantity: item.quantity - removed };
      next.inventory = next.inventory.filter((entry) => entry.quantity > 0);
      applied.push({ type, summary: "-" + removed + " " + item.name });
      continue;
    }

    if (type === "inventory_add" && effect.item && typeof effect.item === "object") {
      const raw = effect.item as Record<string, unknown>;
      const categories = ["weapon", "armor", "tool", "consumable", "quest", "material", "currency", "other"];
      if (typeof raw.id !== "string" || typeof raw.name !== "string" || !categories.includes(String(raw.category))) continue;
      const quantity = clamp(Math.trunc(Number(raw.quantity) || 1), 1, 20);
      const existing = next.inventory.findIndex((item) => item.id === raw.id);
      if (existing >= 0) {
        const itemName = next.inventory[existing].name;
        next.inventory[existing] = { ...next.inventory[existing], quantity: next.inventory[existing].quantity + quantity };
        applied.push({ type, summary: "+" + quantity + " " + itemName });
        continue;
      }
      const item: CampaignState["inventory"][number] = {
        id: raw.id.slice(0, 80),
        name: raw.name.slice(0, 120),
        category: raw.category as CampaignState["inventory"][number]["category"],
        quantity,
        weight: clamp(Number(raw.weight) || 0, 0, 200),
        condition: clamp(Math.trunc(Number(raw.condition) || 100), 0, 100),
        maxCondition: 100,
        value: clamp(Math.trunc(Number(raw.value) || 0), 0, 100000),
        details: typeof raw.details === "string" ? raw.details.slice(0, 500) : "",
        tags: Array.isArray(raw.tags)
          ? raw.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 12)
          : [],
      };
      next.inventory.push(item);
      applied.push({ type, summary: "+" + quantity + " " + item.name });
      continue;
    }

    if (type === "milestone" && typeof effect.id === "string") {
      const index = next.milestones.findIndex((milestone) => milestone.id === effect.id);
      if (index < 0) continue;
      const milestone = next.milestones[index];
      const statuses = ["hidden", "active", "complete", "failed"];
      const progress = clamp(milestone.progress + safeDelta(effect.progressDelta, milestone.target), 0, milestone.target);
      const status = progress >= milestone.target
        ? "complete"
        : (typeof effect.status === "string" && statuses.includes(effect.status)
          ? effect.status as typeof milestone.status
          : milestone.status);
      next.milestones[index] = { ...milestone, progress, status };
      applied.push({ type, summary: milestone.title + ": " + progress + "/" + milestone.target });
      continue;
    }

    if (type === "language" && typeof effect.id === "string" && effect.id in next.character.languages) {
      const current = next.character.languages[effect.id];
      const fluency = clamp(current + safeDelta(effect.fluencyDelta, 1), 0, 5);
      next.character.languages[effect.id] = fluency;
      applied.push({ type, summary: effect.id + " fluency " + fluency + "/5" });
      continue;
    }

    if (type === "objective" && typeof effect.text === "string" && effect.text.trim()) {
      next.objective = effect.text.trim().slice(0, 240);
      applied.push({ type, summary: "Objective updated" });
    }
  }

  next.updatedAt = new Date().toISOString();
  return { state: next, applied };
}

export function addNarrativeState(
  state: CampaignState,
  input: {
    title: string;
    narrative: string;
    image: string;
    memory?: string;
    journal?: string;
  },
) {
  const now = new Date().toISOString();
  const logs = [
    {
      id: "log-" + state.turn + "-" + Date.now(),
      turn: state.turn,
      kind: "narration" as const,
      title: input.title,
      body: input.narrative,
      location: state.world.location,
      image: input.image,
      createdAt: now,
    },
    ...state.logs,
  ].slice(0, 250);

  let memories = state.memories;
  if (input.memory?.trim()) {
    memories = [
      {
        id: "mem-" + state.turn + "-" + Date.now(),
        summary: input.memory.trim(),
        importance: 3 as const,
        tags: [state.world.location.toLowerCase().replaceAll(" ", "-")],
        createdTurn: state.turn,
        lastReferencedTurn: state.turn,
      },
      ...memories,
    ].slice(0, 200);
  }

  let journal = state.journal;
  if (input.journal?.trim() && journal[0]) {
    journal = [{ ...journal[0], body: input.journal.trim() }, ...journal.slice(1)];
  }

  return { ...state, logs, memories, journal, updatedAt: now };
}

export function fallbackNarration(state: CampaignState, action: string, roll: RollResult) {
  const success = roll.outcome === "success" || roll.outcome === "critical-success";
  const critical = roll.outcome.startsWith("critical");
  const opening = success
    ? "The choice lands cleanly. "
    : "The world pushes back. ";
  const texture = state.world.location === "Gallowspire"
    ? "Rain ticks against black slate and runs in silver threads through the gutters. "
    : "The air seems to hold its breath around you. ";
  const consequence = success
    ? "You gain ground without breaking the logic of the place."
    : "You do not get what you wanted cleanly; something notices, shifts, or becomes more expensive.";
  return {
    title: critical ? "A hard turn of fate" : (success ? "The road gives an inch" : "The cost of trying"),
    narrative: opening + texture + "You " + action.trim() + ". " + consequence,
    image: state.locations.find((l) => l.name === state.world.location)?.image ?? "/art/gloam-coast.svg",
    journal: "I " + action.trim() + ". The attempt ended in " + roll.outcome.replace("-", " ") + " (" + roll.total + " vs " + roll.dc + ").",
    memory: critical ? "A consequential " + roll.outcome.replace("-", " ") + " occurred while attempting: " + action.trim() : undefined,
  };
}
