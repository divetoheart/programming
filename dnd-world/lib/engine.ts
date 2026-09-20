import type {
  AttributeKey,
  CampaignState,
  JournalEntry,
  Memory,
  RollResult,
  SkillKey,
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
