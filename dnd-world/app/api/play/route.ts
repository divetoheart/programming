import { NextResponse } from "next/server";
import { isAuthorized } from "../../../lib/auth";
import { addNarrativeState, applyMechanicalTurn, rollAction } from "../../../lib/engine";
import { loadCampaign, repoSyncConfigured, saveCampaign } from "../../../lib/github-store";
import { narrateTurn } from "../../../lib/narrator";
import { createSeedCampaign } from "../../../lib/seed";
import type { CampaignState } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const action = String(body?.action || "").trim();

  if (!action || action.length > 1200) {
    return NextResponse.json({ error: "Action must be between 1 and 1200 characters." }, { status: 400 });
  }

  const connected = repoSyncConfigured();
  const clientState = body?.state as CampaignState | undefined;
  const current = connected
    ? await loadCampaign()
    : (clientState?.campaignId === "mournreach-main" ? clientState : createSeedCampaign());

  const { roll, profile } = rollAction(current, action);
  const mechanical = applyMechanicalTurn(current, action, roll, profile);
  const narration = await narrateTurn(mechanical.state, action, roll);
  const next = addNarrativeState(mechanical.state, narration);
  const save = await saveCampaign(next);

  return NextResponse.json({
    state: next,
    roll,
    narrative: narration.narrative,
    title: narration.title,
    image: narration.image,
    mechanicalSummary: mechanical.mechanicalSummary,
    repoSync: connected,
    persisted: save.persisted,
  });
}
