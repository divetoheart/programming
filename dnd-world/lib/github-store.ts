import { createSeedCampaign } from "./seed";
import type { CampaignState } from "./types";

const repo = process.env.GITHUB_SAVE_REPO || "divetoheart/programming";
const branch = process.env.GITHUB_SAVE_BRANCH || "campaign-data";
const path = process.env.GITHUB_SAVE_PATH || "dnd-world/data/campaign.json";
const token = process.env.GITHUB_SAVE_TOKEN;

function headers() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function endpoint() {
  const [owner, name] = repo.split("/");
  return "https://api.github.com/repos/" + owner + "/" + name + "/contents/" + path;
}

export function repoSyncConfigured() {
  return Boolean(token);
}

export async function loadCampaign(): Promise<CampaignState> {
  if (!token) return createSeedCampaign();

  const response = await fetch(endpoint() + "?ref=" + encodeURIComponent(branch), {
    headers: headers(),
    cache: "no-store",
  });

  if (!response.ok) return createSeedCampaign();

  const payload = await response.json();
  const content = Buffer.from(String(payload.content).replace(/\n/g, ""), "base64").toString("utf8");
  return JSON.parse(content) as CampaignState;
}

export async function saveCampaign(state: CampaignState) {
  if (!token) {
    return { persisted: false, reason: "GITHUB_SAVE_TOKEN is not configured" };
  }

  const current = await fetch(endpoint() + "?ref=" + encodeURIComponent(branch), {
    headers: headers(),
    cache: "no-store",
  });

  let sha: string | undefined;
  if (current.ok) {
    const payload = await current.json();
    sha = payload.sha;
  }

  const body: Record<string, unknown> = {
    message: "campaign: turn " + state.turn + " — " + state.world.location,
    content: Buffer.from(JSON.stringify(state, null, 2), "utf8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const response = await fetch(endpoint(), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error("GitHub save failed: " + response.status + " " + detail);
  }

  return { persisted: true };
}
