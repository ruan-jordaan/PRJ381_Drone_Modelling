import AdmZip from "adm-zip";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/storage";
import { getNodeODMResultUrl, getNodeODMTaskStatus } from "@/lib/nodeodm";

export type ModelSyncResult =
  | { status: "not_started" }
  | { status: "processing"; nodeOdmStatusCode: number; progress: number }
  | { status: "error"; message: string }
  | { status: "ready" };

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
    await prisma.case.update({
      where: { id: caseId },
      data: { nodeOdmTaskId: null, status: "UPLOADED" },
    });
    return {
      status: "error",
      message: "NodeODM lost track of this task. Please start processing again.",
    };
  }

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
