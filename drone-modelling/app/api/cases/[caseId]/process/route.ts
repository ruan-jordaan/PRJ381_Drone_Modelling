import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNodeODMTask } from "@/lib/nodeodm";
import { getDownloadUrl } from "@/lib/storage";

// NodeODM runs inside Docker, so a webhook URL has to be reachable from
// *inside* that container — "localhost" there means the container itself,
// not this host. Docker Desktop (Windows/Mac) exposes the host as
// host.docker.internal automatically; on native Linux Docker this needs
// `extra_hosts: ["host.docker.internal:host-gateway"]` added to
// docker-compose.yml. Override via NODEODM_WEBHOOK_BASE_URL if that default
// doesn't fit (e.g. NodeODM running on a different machine).
const WEBHOOK_BASE_URL =
  process.env.NODEODM_WEBHOOK_BASE_URL || "http://host.docker.internal:3001";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;

  const caseData = await prisma.case.findFirst({
    where: { id: caseId, contractorId: user.id },
    include: { images: true },
  });

  if (!caseData || caseData.images.length === 0) {
    return NextResponse.json(
      { error: "No images available for processing" },
      { status: 400 },
    );
  }

  // Atomically claim the case for processing: the WHERE clause re-checks
  // status at the moment of the write, not just when we read it above, so
  // two concurrent requests (double-click, two tabs) can't both pass the
  // check and fire two overlapping NodeODM tasks. If count is 0, someone
  // else already claimed it between our read and this write.
  const claim = await prisma.case.updateMany({
    where: { id: caseId, status: { not: "PROCESSING" } },
    data: { status: "PROCESSING" },
  });
  if (claim.count === 0) {
    return NextResponse.json(
      { error: "This case is already being processed" },
      { status: 409 },
    );
  }

  try {
    const imageUrls = await Promise.all(
      caseData.images.map((img) => getDownloadUrl(img.url)),
    );
    const webhookUrl = `${WEBHOOK_BASE_URL}/api/webhooks/nodeodm?caseId=${caseId}`;
    const taskId = await createNodeODMTask(imageUrls, webhookUrl);

    await prisma.case.update({
      where: { id: caseId },
      // Clear modelUrl so a re-run doesn't keep serving the old model once
      // this new task completes.
      data: { nodeOdmTaskId: taskId, modelUrl: null },
    });

    return NextResponse.json({ success: true, taskId: taskId });
  } catch (error: any) {
    // Starting the NodeODM task itself failed (upload error, NodeODM
    // unreachable, etc.) — release the claim so the case isn't stuck on
    // PROCESSING forever with no task actually running.
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "UPLOADED" },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
