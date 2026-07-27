"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyPublishedUpdates,
  CAMPAIGN_DATA_VERSION,
  createCampaignSeed,
  STORAGE_KEY,
  type Ability,
  type CampaignState,
  type LogKind,
  type StoredCampaign,
} from "../lib/campaign-data";

const LEGACY_STORAGE_KEY = "living-campaign-v1";

function modifier(score: number) {
  const value = Math.floor((score - 10) / 2);
  return value >= 0 ? `+${value}` : `${value}`;
}

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function loadCampaign(): CampaignState {
  const current = window.localStorage.getItem(STORAGE_KEY);
  if (current) {
    try {
      const stored = JSON.parse(current) as StoredCampaign;
      return applyPublishedUpdates(stored.state, stored.dataVersion ?? 0);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      const legacyState = JSON.parse(legacy) as CampaignState;
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return applyPublishedUpdates(legacyState, 0);
    } catch {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  return createCampaignSeed();
}

export default function CampaignPage() {
  const [state, setState] = useState<CampaignState>(() => createCampaignSeed());
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [command, setCommand] = useState("");
  const [itemName, setItemName] = useState("");
  const [noteMode, setNoteMode] = useState<"notes" | "journal">("notes");

  useEffect(() => {
    setState(loadCampaign());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const stored: StoredCampaign = { dataVersion: CAMPAIGN_DATA_VERSION, state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [ready, state]);

  const latest = state.logs[0];
  const hpPercent = Math.max(0, Math.min(100, (state.character.hp / state.character.maxHp) * 100));
  const totalCoins = useMemo(
    () => state.inventory.filter((item) => item.name.toLowerCase().includes("gold")).reduce((sum, item) => sum + item.quantity, 0),
    [state.inventory],
  );

  function addLog(kind: LogKind, title: string, body: string) {
    setState((current) => ({
      ...current,
      logs: [{ id: uid(), kind, title, body, createdAt: new Date().toISOString() }, ...current.logs].slice(0, 100),
    }));
  }

  function submitCommand() {
    const text = command.trim();
    if (!text) return;
    addLog("prompt", "Your action", text);
    setCommand("");
  }

  function makeRoll(sides: number) {
    const result = rollDie(sides);
    addLog("roll", `d${sides} roll`, `Rolled 1d${sides}: ${result}`);
  }

  function attack() {
    const abilityMod = Math.floor((state.character.abilities.DEX - 10) / 2);
    const die = rollDie(20);
    const attackTotal = die + abilityMod + state.character.proficiency;
    const damageDie = rollDie(8);
    const damage = Math.max(0, damageDie + abilityMod);
    const enemy = state.enemies[0];
    const hit = enemy ? attackTotal >= enemy.armorClass : false;
    const signedMod = `${abilityMod >= 0 ? "+" : ""}${abilityMod}`;
    const body = `Attack: d20 ${die} + DEX ${signedMod} + proficiency +${state.character.proficiency} = ${attackTotal}. ${
      enemy
        ? hit
          ? `Hit ${enemy.name}. Damage: d8 ${damageDie} + DEX ${signedMod} = ${damage}.`
          : `Missed ${enemy.name} (AC ${enemy.armorClass}).`
        : "No target selected."
    }`;
    addLog("attack", "Longbow attack", body);
    if (enemy && hit) {
      setState((current) => ({
        ...current,
        enemies: current.enemies.map((entry, index) => index === 0 ? { ...entry, hp: Math.max(0, entry.hp - damage) } : entry),
      }));
    }
  }

  function addInventoryItem() {
    const name = itemName.trim();
    if (!name) return;
    setState((current) => ({
      ...current,
      inventory: [...current.inventory, { id: uid(), name, quantity: 1, details: "Newly acquired" }],
      logs: [{ id: uid(), kind: "system", title: "Inventory updated", body: `Added ${name}.`, createdAt: new Date().toISOString() }, ...current.logs],
    }));
    setItemName("");
  }

  function resetCampaign() {
    if (!window.confirm("Reset all locally saved campaign data?")) return;
    const seed = createCampaignSeed();
    setState(seed);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Persistent campaign console</p>
          <input className="campaign-title" aria-label="Campaign name" value={state.campaignName} onChange={(event) => setState({ ...state, campaignName: event.target.value })} />
          <p className="subtle">{state.chapter} · {state.location}</p>
        </div>
        <div className="status-group">
          <span className="save-state">● {ready ? `Saved · data v${CAMPAIGN_DATA_VERSION}` : "Loading"}</span>
          <button className="ghost danger" onClick={resetCampaign}>Reset</button>
        </div>
      </header>

      <section className="moment-panel">
        <div className="moment-heading">
          <div><p className="eyebrow">Current moment</p><h2>{latest?.title ?? "No activity yet"}</h2></div>
          {latest && <span className={`kind ${latest.kind}`}>{latest.kind}</span>}
        </div>
        <p className="moment-copy">{latest?.body ?? "Enter an action to begin."}</p>
        <div className="quick-actions">
          {[4, 6, 8, 10, 12, 20].map((die) => <button key={die} className="die" onClick={() => makeRoll(die)}>d{die}</button>)}
          <button className="primary" onClick={attack}>Attack</button>
        </div>
      </section>

      <section className="dashboard">
        <aside className="character-card panel">
          <div className="portrait">{state.character.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <input className="character-name" value={state.character.name} aria-label="Character name" onChange={(event) => setState({ ...state, character: { ...state.character, name: event.target.value } })} />
          <p className="subtle">Level {state.character.level} {state.character.ancestry} {state.character.className}</p>
          <div className="hp-line"><span>HP</span><strong>{state.character.hp}/{state.character.maxHp}</strong></div>
          <div className="meter"><span style={{ width: `${hpPercent}%` }} /></div>
          <div className="stat-trio">
            <div><span>AC</span><strong>{state.character.armorClass}</strong></div>
            <div><span>Speed</span><strong>{state.character.speed}</strong></div>
            <div><span>Prof.</span><strong>+{state.character.proficiency}</strong></div>
          </div>
          <div className="abilities">
            {(Object.entries(state.character.abilities) as [Ability, number][]).map(([ability, score]) => <div key={ability}><span>{ability}</span><strong>{score}</strong><small>{modifier(score)}</small></div>)}
          </div>
          <label className="field-label">Current HP<input type="number" value={state.character.hp} onChange={(event) => setState({ ...state, character: { ...state.character, hp: Number(event.target.value) } })} /></label>
        </aside>

        <section className="workspace panel">
          <nav className="tabs" aria-label="Campaign sections">
            {[["map", "World map"], ["inventory", "Inventory"], ["quests", "Quests"], ["party", "Party"], ["notes", "Notes"], ["history", "History"]].map(([id, label]) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>{label}</button>)}
          </nav>

          {activeTab === "map" && <div className="map-view">
            <div className="map-canvas">
              <svg viewBox="0 0 900 500" role="img" aria-label="Stylized campaign map">
                <path className="land" d="M28 72 C150 15 242 59 340 42 C454 22 526 82 620 64 C742 41 850 96 874 201 C895 302 815 432 680 444 C567 455 507 400 402 432 C274 471 164 417 94 340 C28 268 -19 158 28 72Z" />
                <path className="river" d="M107 8 C160 104 251 108 284 190 C319 278 272 359 356 500" />
                <path className="road" d="M175 348 C289 316 366 248 470 260 C585 275 655 202 770 166" />
                <g className="mountains"><path d="M557 110 l35 -60 l35 60"/><path d="M610 122 l42 -73 l43 73"/><path d="M680 135 l34 -58 l35 58"/></g>
                <g className="forest"><circle cx="714" cy="303" r="19"/><circle cx="748" cy="327" r="22"/><circle cx="685" cy="336" r="18"/><circle cx="779" cy="288" r="17"/></g>
                <g className="marker current"><circle cx="292" cy="249" r="13"/><text x="313" y="255">{state.location}</text></g>
                <g className="marker"><circle cx="487" cy="253" r="9"/><text x="505" y="259">Eastern Beacon</text></g>
                <g className="marker"><circle cx="175" cy="349" r="9"/><text x="94" y="378">Old Ash Road</text></g>
              </svg>
              <div className="map-key">The interface remains fixed; campaign data and published updates live in lib/campaign-data.ts.</div>
            </div>
            <div className="objective-card">
              <p className="eyebrow">Active objective</p>
              <textarea value={state.objective} onChange={(event) => setState({ ...state, objective: event.target.value })} />
              <label className="field-label">Location<input value={state.location} onChange={(event) => setState({ ...state, location: event.target.value })} /></label>
            </div>
          </div>}

          {activeTab === "inventory" && <div className="list-view">
            <div className="section-heading"><div><p className="eyebrow">Carried items</p><h3>Inventory</h3></div><span>{totalCoins} gp</span></div>
            {state.inventory.map((item) => <div className="list-row" key={item.id}>
              <div><strong>{item.name}</strong><p>{item.details}</p></div>
              <input type="number" min="0" value={item.quantity} onChange={(event) => setState({ ...state, inventory: state.inventory.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) } : entry) })} />
              <button className="ghost danger" onClick={() => setState({ ...state, inventory: state.inventory.filter((entry) => entry.id !== item.id) })}>Remove</button>
            </div>)}
            <div className="add-row"><input placeholder="Add item" value={itemName} onChange={(event) => setItemName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addInventoryItem()} /><button className="primary" onClick={addInventoryItem}>Add</button></div>
          </div>}

          {activeTab === "quests" && <div className="list-view">
            <div className="section-heading"><div><p className="eyebrow">Adventure log</p><h3>Quests</h3></div></div>
            {state.quests.map((quest) => <button className={`quest ${quest.status}`} key={quest.id} onClick={() => setState({ ...state, quests: state.quests.map((entry) => entry.id === quest.id ? { ...entry, status: entry.status === "active" ? "complete" : "active" } : entry) })}>
              <span>{quest.status === "complete" ? "✓" : "○"}</span><div><strong>{quest.title}</strong><p>{quest.details}</p></div>
            </button>)}
          </div>}

          {activeTab === "party" && <div className="list-view">
            <div className="section-heading"><div><p className="eyebrow">Companions and threats</p><h3>Encounter</h3></div></div>
            <h4>Party</h4>
            {state.party.map((member) => <div className="combatant" key={member.id}><strong>{member.name}</strong><span>{member.role}</span><span>{member.hp}/{member.maxHp} HP</span></div>)}
            <h4>Enemies</h4>
            {state.enemies.map((enemy) => <div className="combatant enemy" key={enemy.id}><strong>{enemy.name}</strong><span>AC {enemy.armorClass}</span><span>{enemy.hp}/{enemy.maxHp} HP</span></div>)}
          </div>}

          {activeTab === "notes" && <div className="notes-view">
            <div className="segmented"><button className={noteMode === "notes" ? "active" : ""} onClick={() => setNoteMode("notes")}>Session notes</button><button className={noteMode === "journal" ? "active" : ""} onClick={() => setNoteMode("journal")}>Character journal</button></div>
            <textarea className="notebook" value={noteMode === "notes" ? state.notes : state.journal} onChange={(event) => setState({ ...state, [noteMode]: event.target.value })} />
          </div>}

          {activeTab === "history" && <div className="history-view">{state.logs.map((log) => <article className={`history-entry ${log.kind}`} key={log.id}><div><span>{log.kind}</span><time>{formatTime(log.createdAt)}</time></div><strong>{log.title}</strong><p>{log.body}</p></article>)}</div>}
        </section>

        <aside className="activity panel">
          <div className="section-heading"><div><p className="eyebrow">Live record</p><h3>Activity</h3></div></div>
          <div className="activity-feed">{state.logs.slice(0, 8).map((log) => <article key={log.id} className={log.kind}><div><span>{log.kind}</span><time>{formatTime(log.createdAt)}</time></div><p>{log.body}</p></article>)}</div>
          <div className="command-box">
            <label htmlFor="command">What do you do?</label>
            <textarea id="command" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Describe your action without speaking for the other characters…" />
            <button className="primary wide" onClick={submitCommand}>Record action</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
