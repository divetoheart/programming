"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSeedCampaign } from "../lib/seed";
import type { CampaignState, LocationState } from "../lib/types";
import { WORLD_BIBLE } from "../lib/world";

type Tab = "play" | "map" | "character" | "inventory" | "journal" | "memory" | "milestones" | "codex";
const LOCAL_KEY = "mournreach-campaign-backup-v3";

const nav: { id: Tab; label: string }[] = [
  { id: "play", label: "Play" },
  { id: "map", label: "Map" },
  { id: "character", label: "Character" },
  { id: "inventory", label: "Inventory" },
  { id: "journal", label: "Journal" },
  { id: "memory", label: "Memory" },
  { id: "milestones", label: "Milestones" },
  { id: "codex", label: "Codex" },
];

function percent(value: number, max: number) {
  return Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
}

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function Meter({ label, value, max, danger = false }: { label: string; value: number; max: number; danger?: boolean }) {
  return (
    <div className={"meter " + (danger ? "danger" : "")}>
      <div><span>{label}</span><strong>{value}/{max}</strong></div>
      <i><b style={{ width: percent(value, max) + "%" }} /></i>
    </div>
  );
}

function LocationMap({ state, onSelect }: { state: CampaignState; onSelect: (location: LocationState) => void }) {
  const discovered = state.locations.filter((location) => location.discovered);
  return (
    <div className="map-frame">
      <svg className="world-map" viewBox="0 0 100 100" role="img" aria-label="Map of Mournreach">
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#101b22" />
            <stop offset="1" stopColor="#05090d" />
          </linearGradient>
          <filter id="rough"><feTurbulence baseFrequency=".035" numOctaves="3" seed="11" /><feDisplacementMap in="SourceGraphic" scale="1.6" /></filter>
        </defs>
        <rect width="100" height="100" fill="url(#sea)" />
        <path d="M8 71 L15 45 L25 34 L32 17 L50 11 L66 18 L83 32 L91 54 L84 76 L67 88 L43 92 L23 86Z" className="landmass" filter="url(#rough)" />
        <path d="M18 63 C31 54 42 56 51 44 C58 35 70 37 80 32" className="road" />
        <path d="M25 69 C40 67 45 61 49 51 C53 41 50 30 55 20" className="river" />
        <text x="12" y="20">SAINT&apos;S TEETH</text>
        <text x="6" y="59">GLOAM COAST</text>
        <text x="38" y="69">WEEPING FEN</text>
        <text x="66" y="59">CINDER MARCH</text>
        <text x="42" y="40">BLACKWOOD</text>
        {discovered.map((location) => {
          const current = location.name === state.world.location;
          return (
            <g key={location.id} className={"map-node " + (current ? "current" : "")} onClick={() => onSelect(location)} role="button">
              <circle cx={location.x} cy={location.y} r={current ? 2.2 : 1.4} />
              <circle cx={location.x} cy={location.y} r={current ? 4.3 : 3} className="map-node-ring" />
              <text x={location.x + 2.8} y={location.y - 2.4}>{location.name.toUpperCase()}</text>
            </g>
          );
        })}
      </svg>
      <div className="map-legend">
        <span><i className="dot current-dot" /> Current</span>
        <span><i className="dot" /> Discovered</span>
        <span>Click a location for details</span>
      </div>
    </div>
  );
}

export default function CampaignPage() {
  const [state, setState] = useState<CampaignState>(createSeedCampaign);
  const [tab, setTab] = useState<Tab>("play");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [repoSync, setRepoSync] = useState(false);
  const [status, setStatus] = useState("Opening the ledger…");
  const [selectedLocation, setSelectedLocation] = useState<LocationState | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        const payload = await response.json();
        if (cancelled) return;
        const serverState = payload.state as CampaignState;
        const local = window.localStorage.getItem(LOCAL_KEY);
        if (!payload.repoSync && local) {
          try {
            setState(JSON.parse(local));
          } catch {
            setState(serverState);
          }
        } else {
          setState(serverState);
        }
        setRepoSync(Boolean(payload.repoSync));
        setStatus(payload.repoSync ? "GitHub ledger connected" : "Local backup mode");
      } catch {
        const local = window.localStorage.getItem(LOCAL_KEY);
        if (local) {
          try { setState(JSON.parse(local)); } catch { setState(createSeedCampaign()); }
        }
        setStatus("Offline/local backup");
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    boot();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  }, [state, ready]);

  const currentImage = state.logs[0]?.image || state.locations.find((l) => l.name === state.world.location)?.image || "/art/gloam-coast.svg";
  const currentQuest = state.quests.find((q) => q.status === "active");
  const carry = useMemo(() => state.inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0), [state.inventory]);
  const activeMilestones = state.milestones.filter((m) => m.status === "active");
  const knownLanguages = WORLD_BIBLE.languages.filter((language) => (state.character.languages[language.id] || 0) > 0);

  async function play(event: FormEvent) {
    event.preventDefault();
    const command = action.trim();
    if (!command || busy) return;
    setBusy(true);
    setStatus("Resolving turn…");
    try {
      const response = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: command, state }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Turn failed");
      setState(payload.state);
      setRepoSync(Boolean(payload.repoSync));
      setAction("");
      setStatus(payload.persisted ? "Turn committed to GitHub" : "Turn saved locally");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Turn failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <div>
          <p className="kicker">Mournreach · persistent campaign</p>
          <h1>{state.campaignName}</h1>
          <p className="subtitle">{state.chapter} · Turn {state.turn}</p>
        </div>
        <div className="save-badge">
          <span className={repoSync ? "online" : "local"} />
          <div><strong>{repoSync ? "Repo synced" : "Local mode"}</strong><small>{status}</small></div>
        </div>
      </header>

      <section className="world-strip">
        <div><span>Location</span><strong>{state.world.location}</strong></div>
        <div><span>Day</span><strong>{state.world.day} · {state.world.time}</strong></div>
        <div><span>Weather</span><strong>{state.world.weather}</strong></div>
        <div><span>Moon</span><strong>{state.world.moon}</strong></div>
      </section>

      <nav className="tabs" aria-label="Game sections">
        {nav.map((item) => (
          <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
            {item.label}
            {item.id === "milestones" && activeMilestones.length > 0 ? <em>{activeMilestones.length}</em> : null}
          </button>
        ))}
      </nav>

      {tab === "play" && (
        <div className="play-grid">
          <section className="scene-panel">
            <div className="scene-image">
              <Image src={currentImage} alt={"Illustration of " + state.world.location} fill priority sizes="(max-width: 900px) 100vw, 66vw" />
              <div className="scene-shade" />
              <div className="scene-caption">
                <p>{state.world.region}</p>
                <h2>{state.logs[0]?.title || state.world.location}</h2>
                <span>Danger {state.world.danger}/5</span>
              </div>
            </div>

            <article className="story-card">
              <p className="kicker">Current scene</p>
              <h2>{state.logs[0]?.title || "The road waits"}</h2>
              <p className="narrative">{state.logs[0]?.body}</p>

              {state.lastRoll ? (
                <div className={"roll-card " + state.lastRoll.outcome}>
                  <div>
                    <span>{titleCase(state.lastRoll.skill)} · {titleCase(state.lastRoll.attribute)}</span>
                    <strong>d20 {state.lastRoll.die} + {state.lastRoll.modifier} = {state.lastRoll.total}</strong>
                  </div>
                  <div>
                    <span>DC {state.lastRoll.dc}</span>
                    <strong>{titleCase(state.lastRoll.outcome)}</strong>
                  </div>
                </div>
              ) : null}

              <div className="objective">
                <span>Current objective</span>
                <strong>{state.objective}</strong>
              </div>
            </article>

            <div className="history">
              <div className="section-heading"><div><p className="kicker">Chronicle</p><h3>Recent turns</h3></div><span>{state.logs.length} records</span></div>
              {state.logs.slice(1, 7).map((log) => (
                <article key={log.id}>
                  <small>Turn {log.turn} · {log.location}</small>
                  <strong>{log.title}</strong>
                  <p>{log.body}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="hud">
            <div className="identity">
              <span>Level {state.character.level} {state.character.calling}</span>
              <h2>{state.character.name}</h2>
              <p>{state.character.epithet}</p>
            </div>
            <Meter label="Health" value={state.character.hp} max={state.character.maxHp} />
            <Meter label="Stamina" value={state.character.stamina} max={state.character.maxStamina} />
            <Meter label="Resolve" value={state.character.resolve} max={state.character.maxResolve} />
            <Meter label="Hunger" value={state.character.hunger} max={100} danger />

            <div className="hud-row">
              <div><span>Armor</span><strong>{state.character.armor}</strong></div>
              <div><span>Evasion</span><strong>{state.character.evasion}</strong></div>
              <div><span>Crowns</span><strong>{state.character.crowns}</strong></div>
              <div><span>Carry</span><strong>{carry.toFixed(1)}/{state.character.carryMax}</strong></div>
            </div>

            <div className="mini-section">
              <span>Active quest</span>
              <strong>{currentQuest?.title || "None"}</strong>
              <p>{currentQuest?.summary}</p>
            </div>
            <div className="mini-section">
              <span>Conditions & wounds</span>
              {state.character.conditions.length === 0 && state.character.wounds.length === 0 ? <p>None.</p> : null}
              {state.character.conditions.map((condition) => <p key={condition.id}>{condition.name} · Severity {condition.severity}</p>)}
              {state.character.wounds.map((wound) => <p key={wound.id}>{wound.location}: {wound.name} · Severity {wound.severity}</p>)}
            </div>
          </aside>
        </div>
      )}

      {tab === "map" && (
        <section className="panel">
          <div className="section-heading"><div><p className="kicker">Persistent geography</p><h2>Map of Mournreach</h2></div><span>{state.locations.filter((l) => l.discovered).length}/{state.locations.length} known locations</span></div>
          <LocationMap state={state} onSelect={setSelectedLocation} />
          <div className="location-detail">
            {selectedLocation ? (
              <>
                <div className="location-art"><Image src={selectedLocation.image} alt={selectedLocation.name} fill sizes="320px" /></div>
                <div><p className="kicker">{selectedLocation.region}</p><h3>{selectedLocation.name}</h3><p>{selectedLocation.state}</p><span>Danger {selectedLocation.danger}/5 · {selectedLocation.visited ? "Visited" : "Not visited"}</span></div>
              </>
            ) : (
              <div><p className="kicker">Current location</p><h3>{state.world.location}</h3><p>Select any discovered point on the map to inspect it.</p></div>
            )}
          </div>
        </section>
      )}

      {tab === "character" && (
        <section className="panel">
          <div className="character-hero">
            <div className="portrait"><Image src={currentImage} alt={state.character.name} fill sizes="360px" /></div>
            <div>
              <p className="kicker">{state.character.ancestry} · {state.character.background}</p>
              <h2>{state.character.name}</h2>
              <p className="large-copy">{state.character.epithet} · Level {state.character.level} {state.character.calling}</p>
              <div className="stat-blocks">
                <div><span>XP</span><strong>{state.character.xp}</strong></div>
                <div><span>Speed</span><strong>{state.character.speed} ft</strong></div>
                <div><span>Armor</span><strong>{state.character.armor}</strong></div>
                <div><span>Evasion</span><strong>{state.character.evasion}</strong></div>
              </div>
            </div>
          </div>

          <div className="two-column">
            <div>
              <p className="kicker">Attributes</p>
              <div className="ability-grid">
                {Object.entries(state.character.attributes).map(([name, score]) => <div key={name}><span>{titleCase(name)}</span><strong>{score}</strong></div>)}
              </div>
            </div>
            <div>
              <p className="kicker">Skills</p>
              <div className="skill-list">
                {Object.entries(state.character.skills).sort((a, b) => b[1] - a[1]).map(([name, score]) => <div key={name}><span>{titleCase(name)}</span><strong>+{score}</strong></div>)}
              </div>
            </div>
          </div>

          <div className="two-column">
            <div className="subpanel"><p className="kicker">Languages</p>{knownLanguages.map((language) => <p key={language.id}><strong>{language.name}</strong> · Fluency {state.character.languages[language.id]}/5<br /><span>{language.use}</span></p>)}</div>
            <div className="subpanel"><p className="kicker">Equipped</p>{Object.entries(state.character.equipment).map(([slot, itemId]) => <p key={slot}><strong>{titleCase(slot)}</strong><br /><span>{state.inventory.find((item) => item.id === itemId)?.name || itemId}</span></p>)}</div>
          </div>
        </section>
      )}

      {tab === "inventory" && (
        <section className="panel">
          <div className="section-heading"><div><p className="kicker">Carried possessions</p><h2>Inventory</h2></div><span>{carry.toFixed(1)} / {state.character.carryMax} weight · {state.character.crowns} crowns</span></div>
          <div className="item-grid">
            {state.inventory.map((item) => (
              <article key={item.id}>
                <div className="item-top"><span>{item.category}</span><strong>×{item.quantity}</strong></div>
                <h3>{item.name}</h3>
                <p>{item.details}</p>
                <div className="durability"><span>Condition</span><i><b style={{ width: percent(item.condition, item.maxCondition) + "%" }} /></i><strong>{item.condition}%</strong></div>
                <small>{item.weight} wt · {item.value} crowns · {item.tags.join(" · ")}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "journal" && (
        <section className="panel">
          <div className="section-heading"><div><p className="kicker">First-person record</p><h2>Journal</h2></div><span>{state.journal.length} entries</span></div>
          <div className="journal-list">
            {state.journal.map((entry) => (
              <article key={entry.id}>
                <div className="journal-date"><strong>Day {entry.day}</strong><span>{entry.time}</span><small>Turn {entry.turn}</small></div>
                <div><p className="kicker">{entry.location}</p><h3>{entry.title}</h3><p>{entry.body}</p><small>{entry.tags.join(" · ")}</small></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "memory" && (
        <section className="panel">
          <div className="section-heading"><div><p className="kicker">Canonical memory bank</p><h2>Memories</h2></div><span>Referenced by the GM every turn</span></div>
          <div className="memory-grid">
            {state.memories.sort((a, b) => b.importance - a.importance).map((memory) => (
              <article key={memory.id}>
                <div className="importance">{"◆".repeat(memory.importance)}{"◇".repeat(5 - memory.importance)}</div>
                <p>{memory.summary}</p>
                <small>Created turn {memory.createdTurn} · Last referenced {memory.lastReferencedTurn}</small>
                <div className="tag-row">{memory.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "milestones" && (
        <section className="panel">
          <div className="section-heading"><div><p className="kicker">Long-term progression</p><h2>Milestones</h2></div><span>{state.milestones.filter((m) => m.status === "complete").length} completed</span></div>
          <div className="milestone-list">
            {state.milestones.filter((m) => m.status !== "hidden").map((milestone) => (
              <article key={milestone.id} className={milestone.status}>
                <div><span>{milestone.status}</span><h3>{milestone.title}</h3><p>{milestone.description}</p><small>Reward: {milestone.reward}</small></div>
                <div className="milestone-progress"><strong>{milestone.progress}/{milestone.target}</strong><i><b style={{ width: percent(milestone.progress, milestone.target) + "%" }} /></i></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "codex" && (
        <section className="panel codex">
          <div className="section-heading"><div><p className="kicker">Canonical world bible</p><h2>Mournreach Codex</h2></div><span>{WORLD_BIBLE.age}</span></div>
          <p className="codex-lede">{WORLD_BIBLE.premise}</p>

          <h3 className="codex-title">The laws of the world</h3>
          <div className="law-grid">{WORLD_BIBLE.laws.map((law, index) => <article key={law}><span>0{index + 1}</span><p>{law}</p></article>)}</div>

          <h3 className="codex-title">History</h3>
          <div className="timeline">{WORLD_BIBLE.history.map((event) => <article key={event.era}><strong>{event.era}</strong><p>{event.text}</p></article>)}</div>

          <h3 className="codex-title">Regions</h3>
          <div className="region-grid">
            {WORLD_BIBLE.regions.map((region) => (
              <article key={region.id}>
                <div className="region-image"><Image src={region.image} alt={region.name} fill sizes="420px" /></div>
                <div><p className="kicker">{region.tone}</p><h3>{region.name}</h3><p>{region.description}</p><small>{region.settlements.join(" · ")}</small></div>
              </article>
            ))}
          </div>

          <h3 className="codex-title">Factions in play</h3>
          <div className="faction-grid">
            {WORLD_BIBLE.factions.map((faction) => {
              const live = state.factions.find((entry) => entry.id === faction.id);
              return <article key={faction.id}><div className="rep"><strong>{live?.reputation ?? 0}</strong><span>{live?.stance ?? "unknown"}</span></div><h3>{faction.name}</h3><p>{faction.publicGoal}</p><small>{live?.knownSecret || "No confirmed secret known."}</small></article>;
            })}
          </div>

          <h3 className="codex-title">People remembered</h3>
          <div className="npc-grid">
            {state.npcs.map((npc) => <article key={npc.id}><span>{npc.status}</span><h3>{npc.name}</h3><p>{npc.title} · {npc.location}</p><small>{npc.relationship} · Trust {npc.trust} · Fear {npc.fear}</small>{npc.memory.map((memory) => <p key={memory} className="npc-memory">{memory}</p>)}</article>)}
          </div>

          <h3 className="codex-title">Languages</h3>
          <div className="language-grid">
            {WORLD_BIBLE.languages.map((language) => (
              <article key={language.id}>
                <div><p className="kicker">{language.script}</p><h3>{language.name}</h3><p>{language.use}</p><small>{language.grammar}</small></div>
                <div className="phrasebook">{language.phrases.map((phrase) => <p key={phrase.native}><strong>{phrase.native}</strong><span>{phrase.meaning}</span></p>)}</div>
              </article>
            ))}
          </div>

          <h3 className="codex-title">Rumors</h3>
          <div className="rumor-list">{state.rumors.map((rumor) => <article key={rumor.id}><span>{rumor.truth}</span><p>“{rumor.text}”</p><small>{rumor.source} · turn {rumor.discoveredTurn}</small></article>)}</div>
        </section>
      )}

      <form className="command-deck" onSubmit={play}>
        <div className="command-context">
          <span>{state.world.location}</span>
          <strong>{busy ? "The world is answering…" : "What do you do?"}</strong>
        </div>
        <textarea
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Anything. Search the body. Lie to the prelate. Follow the bell. Speak Nhalic. Start a fight. Leave town."
          rows={2}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !action.trim()}>{busy ? "Resolving…" : "Commit action"}</button>
      </form>
    </main>
  );
}
