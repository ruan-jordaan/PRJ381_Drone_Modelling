import AdmZip from "adm-zip";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl, objectExists, uploadObject } from "@/lib/storage";
import { getNodeODMResultUrl, getNodeODMTaskStatus } from "@/lib/nodeodm";

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

  if (caseRecord.modelUrl) {
    if (await objectExists(caseRecord.modelUrl)) {
      const url = await getDownloadUrl(caseRecord.modelUrl);
      return NextResponse.json({ status: "ready", url });
    }
    // DB points at a key that isn't actually in R2 (stale/mock data) — clear it
    // and fall through to rebuild from NodeODM below.
    await prisma.case.update({ where: { id: caseId }, data: { modelUrl: null } });
  }

  if (!caseRecord.nodeOdmTaskId) {
    return NextResponse.json({ status: "not_started" });
  }

  const nodeStatus = await getNodeODMTaskStatus(caseRecord.nodeOdmTaskId);

  if (nodeStatus.status.code !== 40) {
    return NextResponse.json({
      status: "processing",
      nodeOdmStatusCode: nodeStatus.status.code,
      progress: nodeStatus.progress,
    });
  }

  const zipResponse = await fetch(getNodeODMResultUrl(caseRecord.nodeOdmTaskId));
  if (!zipResponse.ok) {
    return NextResponse.json(
      { error: "Failed to download NodeODM result" },
      { status: 502 }
    );
  }
  const zipBuffer = Buffer.from(await zipResponse.arrayBuffer());

  const zip = new AdmZip(zipBuffer);
  const glbEntry = zip
    .getEntries()
    .find((entry) => entry.entryName.toLowerCase().endsWith(".glb"));

  if (!glbEntry) {
    return NextResponse.json(
      { error: "No .glb file found in NodeODM result" },
      { status: 502 }
    );
  }

  const key = `cases/${caseId}/model.glb`;
  await uploadObject(key, glbEntry.getData(), "model/gltf-binary");

  await prisma.case.update({
    where: { id: caseId },
    data: { modelUrl: key, status: "PROCESSED" },
  });

  const url = await getDownloadUrl(key);
  return NextResponse.json({ status: "ready", url });
}
