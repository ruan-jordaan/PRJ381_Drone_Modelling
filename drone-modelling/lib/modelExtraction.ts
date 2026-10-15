import AdmZip from "adm-zip";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/storage";
import { getNodeODMResultUrl, getNodeODMTaskStatus } from "@/lib/nodeodm";

export type ModelSyncResult =
  | { status: "not_started" }
  | { status: "processing"; nodeOdmStatusCode: number; progress: number }
  | { status: "error"; message: string }
  | { status: "ready" };

// Checks a case's NodeODM task and, once NodeODM reports it complete, pulls
// the .glb out of the result archive and uploads it to R2. Shared by the
// viewer's poll route (GET /model) and the NodeODM webhook (POST
// /webhooks/nodeodm), so both end up at the same extraction logic rather than
// two copies drifting apart.
export async function syncCaseModelFromNodeODM(
  caseId: string,
): Promise<ModelSyncResult> {
  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) {
    return { status: "error", message: "Case not found" };
  }
  if (!caseRecord.nodeOdmTaskId) {
    return { status: "not_started" };
  }

  let nodeStatus;
  try {
    nodeStatus = await getNodeODMTaskStatus(caseRecord.nodeOdmTaskId);
  } catch {
    // NodeODM has no record of this task (e.g. its data volume was reset).
    // Clear the dead task id so a reprocess isn't blocked by the "already
    // processing" guard.
    await prisma.case.update({
      where: { id: caseId },
      data: { nodeOdmTaskId: null, status: "UPLOADED" },
    });
    return {
      status: "error",
      message: "NodeODM lost track of this task. Please start processing again.",
    };
  }

  // NodeODM status codes: 10 queued, 20 running, 30 failed, 40 completed,
  // 50 canceled. 30/50 are terminal failures, not "still processing" — if we
  // don't catch these, the case sits on PROCESSING forever and a reprocess
  // is blocked indefinitely by the claim check in /process.
  if (nodeStatus.status.code === 30 || nodeStatus.status.code === 50) {
    await prisma.case.update({
      where: { id: caseId },
      data: { nodeOdmTaskId: null, status: "UPLOADED" },
    });
    return {
      status: "error",
      message:
        nodeStatus.status.code === 30
          ? "NodeODM processing failed. Please start processing again."
          : "NodeODM processing was canceled. Please start processing again.",
    };
  }

  if (nodeStatus.status.code !== 40) {
    return {
      status: "processing",
      nodeOdmStatusCode: nodeStatus.status.code,
      progress: nodeStatus.progress,
    };
  }

  const zipResponse = await fetch(getNodeODMResultUrl(caseRecord.nodeOdmTaskId));
  if (!zipResponse.ok) {
    return { status: "error", message: "Failed to download NodeODM result" };
  }
  const zipBuffer = Buffer.from(await zipResponse.arrayBuffer());

  const zip = new AdmZip(zipBuffer);
  const glbEntry = zip
    .getEntries()
    .find((entry) => entry.entryName.toLowerCase().endsWith(".glb"));

  if (!glbEntry) {
    return { status: "error", message: "No .glb file found in NodeODM result" };
  }

  const key = `cases/${caseId}/model.glb`;
  await uploadObject(key, glbEntry.getData(), "model/gltf-binary");

  await prisma.case.update({
    where: { id: caseId },
    data: { modelUrl: key, status: "PROCESSED" },
  });

  return { status: "ready" };
}
