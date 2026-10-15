import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { objectExists } from "@/lib/storage";
import { syncCaseModelFromNodeODM } from "@/lib/modelExtraction";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;

  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, contractorId: user.id },
  });
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Served through our own /model/file route rather than a direct R2 URL — see
  // that route for why (some browser/network setups can't reach
  // r2.cloudflarestorage.com directly even though our server can).
  const fileUrl = `/api/cases/${caseId}/model/file`;

  if (caseRecord.modelUrl) {
    if (await objectExists(caseRecord.modelUrl)) {
      return NextResponse.json({ status: "ready", url: fileUrl });
    }
    // DB points at a key that isn't actually in R2 (stale/mock data) — clear it
    // and fall through to check NodeODM below.
    await prisma.case.update({ where: { id: caseId }, data: { modelUrl: null } });
  }

  // NodeODM's webhook (see /api/webhooks/nodeodm) normally already did this
  // extraction by the time anyone opens the viewer, but this poll is kept as
  // a fallback — it's the same sync function, so it's a no-op if the webhook
  // already ran, and it still works if the webhook never arrives (NodeODM
  // unreachable from the webhook, local dev network hiccup, etc).
  const result = await syncCaseModelFromNodeODM(caseId);
  if (result.status === "ready") {
    return NextResponse.json({ status: "ready", url: fileUrl });
  }
  return NextResponse.json(result);
}
