"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyPublishedUpdates,
  CAMPAIGN_DATA_VERSION,
  createCampaignSeed,
  STORAGE_KEY,
  type CampaignState,
  type StoredCampaign,
} from "../lib/campaign-data";

const LEGACY_STORAGE_KEY = "living-campaign-v1";
const ART = {
  hero: "https://wa-cdn.nyc3.digitaloceanspaces.com/user-data/production/bd68739e-1779-4110-b671-d9f296001fd6/uploads/images/c79fa3979530bcd7bab04dd447fc96c2.png",
  scene: "https://b2-backblaze-stackpath.b-cdn.net/2059203/eerwke_54459c402e4a2c36fb8339797277ccbcebb4ce90.jpg",
  fallback: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
};

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
      const state = JSON.parse(legacy) as CampaignState;
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return applyPublishedUpdates(state, 0);
    } catch {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  return createCampaignSeed();
}

export default function CampaignPage() {
  const [state, setState] = useState<CampaignState>(() => createCampaignSeed());
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState("scene");
  const [sceneSrc, setSceneSrc] = useState(ART.scene);

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
  const totalCoins = useMemo(
    () => state.inventory.filter((item) => item.name.toLowerCase().includes("gold")).reduce((sum, item) => sum + item.quantity, 0),
    [state.inventory],
  );

  return (
    <main className="story-shell">
      <header className="story-header">
        <div>
          <p className="eyebrow">Living campaign</p>
          <h1>{state.campaignName}</h1>
          <p>{state.chapter} · {state.location}</p>
        </div>
        <span className="save-state">● {ready ? "Updated" : "Loading"}</span>
      </header>

      <nav className="story-menu" aria-label="Campaign menus">
        {[
          ["scene", "Scene"],
          ["map", "Map"],
          ["inventory", "Inventory"],
          ["journal", "Journal"],
          ["character", "Character"],
          ["quests", "Quests"],
        ].map(([id, label]) => (
          <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </nav>

      {activeTab === "scene" && (
        <section className="scene-page">
          <div className="scene-art-wrap">
            <img src={sceneSrc} alt={`Fantasy scene at ${state.location}`} onError={() => setSceneSrc(ART.fallback)} />
            <div className="scene-label">
              <span>{state.location}</span>
              <strong>{latest?.title ?? "The road waits"}</strong>
            </div>
          </div>
          <article className="narrative-card">
            <p className="eyebrow">Current scene</p>
            <h2>{latest?.title ?? "The road waits"}</h2>
            <p className="narrative-copy">{latest?.body ?? "The path ahead is quiet, but not empty."}</p>
            <div className="scene-facts">
              <div><span>Objective</span><strong>{state.objective}</strong></div>
              <div><span>Location</span><strong>{state.location}</strong></div>
            </div>
          </article>
        </section>
      )}

      {activeTab === "map" && (
        <section className="content-card map-page">
          <img src={sceneSrc} alt={`Illustrated region around ${state.location}`} onError={() => setSceneSrc(ART.fallback)} />
          <div>
            <p className="eyebrow">Current region</p>
            <h2>{state.location}</h2>
            <p>{state.objective}</p>
          </div>
        </section>
      )}

      {activeTab === "inventory" && (
        <section className="content-card">
          <div className="section-title"><div><p className="eyebrow">Carried items</p><h2>Inventory</h2></div><strong>{totalCoins} gp</strong></div>
          <div className="record-list">
            {state.inventory.map((item) => <article key={item.id}><div><strong>{item.name}</strong><p>{item.details}</p></div><span>×{item.quantity}</span></article>)}
          </div>
        </section>
      )}

      {activeTab === "journal" && (
        <section className="content-card journal-page">
          <p className="eyebrow">Written record</p>
          <h2>Journal</h2>
          <div className="journal-block"><h3>Character journal</h3><p>{state.journal}</p></div>
          <div className="journal-block"><h3>Session notes</h3><p>{state.notes}</p></div>
          <div className="journal-block"><h3>Recent events</h3>{state.logs.slice(0, 8).map((log) => <article key={log.id}><strong>{log.title}</strong><p>{log.body}</p></article>)}</div>
        </section>
      )}

      {activeTab === "character" && (
        <section className="content-card character-page">
          <img src={ART.hero} alt={`Portrait of ${state.character.name}`} />
          <div>
            <p className="eyebrow">Player character</p>
            <h2>{state.character.name}</h2>
            <p>Level {state.character.level} {state.character.ancestry} {state.character.className} · {state.character.background}</p>
            <div className="character-stats">
              <div><span>HP</span><strong>{state.character.hp}/{state.character.maxHp}</strong></div>
              <div><span>AC</span><strong>{state.character.armorClass}</strong></div>
              <div><span>Speed</span><strong>{state.character.speed}</strong></div>
              <div><span>XP</span><strong>{state.character.xp}</strong></div>
            </div>
            <div className="ability-grid">{Object.entries(state.character.abilities).map(([name, score]) => <div key={name}><span>{name}</span><strong>{score}</strong></div>)}</div>
          </div>
        </section>
      )}

      {activeTab === "quests" && (
        <section className="content-card">
          <p className="eyebrow">Adventure record</p>
          <h2>Quests</h2>
          <div className="record-list">
            {state.quests.map((quest) => <article key={quest.id} className={quest.status}><div><strong>{quest.title}</strong><p>{quest.details}</p></div><span>{quest.status}</span></article>)}
          </div>
        </section>
      )}
    </main>
  );
}
