import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNodeODMTask } from "@/lib/nodeodm";
import { getDownloadUrl } from "@/lib/storage";

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
      data: { nodeOdmTaskId: taskId, modelUrl: null },
    });

    return NextResponse.json({ success: true, taskId: taskId });
  } catch (error) {
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "UPLOADED" },
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to start processing" }, { status: 500 });
  }
}
