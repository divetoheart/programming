import type { CampaignState, RollResult } from "./types";
import { buildTurnContext } from "./context";
import { fallbackNarration } from "./engine";

type NarratorResult = {
  title: string;
  narrative: string;
  image: string;
  journal: string;
  memory?: string;
};

function parseJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Narrator returned no JSON object");
  return JSON.parse(text.slice(start, end + 1));
}

export async function narrateTurn(state: CampaignState, action: string, roll: RollResult): Promise<NarratorResult> {
  const apiKey = process.env.AI_API_KEY;
  const chatUrl = process.env.AI_CHAT_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !chatUrl || !model) {
    return fallbackNarration(state, action, roll);
  }

  try {
    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        messages: [
          { role: "system", content: buildTurnContext(state, action, roll) },
          { role: "user", content: "Narrate this resolved turn." },
        ],
      }),
    });

    if (!response.ok) throw new Error("Narrator HTTP " + response.status);
    const payload = await response.json();
    const raw = payload?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("Narrator response shape was not OpenAI-compatible");
    const parsed = parseJsonObject(raw);

    return {
      title: String(parsed.title || "The road turns"),
      narrative: String(parsed.narrative || ""),
      image: String(parsed.image || "/art/gloam-coast.svg"),
      journal: String(parsed.journal || ""),
      memory: String(parsed.memory || ""),
    };
  } catch {
    return fallbackNarration(state, action, roll);
  }
}
