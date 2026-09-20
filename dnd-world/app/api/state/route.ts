import { NextResponse } from "next/server";
import { loadCampaign, repoSyncConfigured, saveCampaign } from "../../../lib/github-store";
import type { CampaignState } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await loadCampaign();
  return NextResponse.json({ state, repoSync: repoSyncConfigured() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const state = body?.state as CampaignState | undefined;
  if (!state || state.campaignId !== "mournreach-main" || !state.character?.name) {
    return NextResponse.json({ error: "Invalid campaign state" }, { status: 400 });
  }

  const result = await saveCampaign(state);
  return NextResponse.json({ ok: true, ...result });
}
