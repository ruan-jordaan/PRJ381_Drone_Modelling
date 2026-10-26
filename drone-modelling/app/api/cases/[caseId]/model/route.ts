import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caseReadWhere } from "@/lib/caseAccess";
import { UserRole } from "@prisma/client";
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
    where: caseReadWhere(user, caseId),
  });
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const fileUrl = `/api/cases/${caseId}/model/file`;

  if (user.role !== UserRole.CONTRACTOR) {
    return caseRecord.modelUrl
      ? NextResponse.json({ status: "ready", url: fileUrl })
      : NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  if (caseRecord.modelUrl) {
    if (await objectExists(caseRecord.modelUrl)) {
      return NextResponse.json({ status: "ready", url: fileUrl });
    }
    await prisma.case.update({ where: { id: caseId }, data: { modelUrl: null } });
  }

  const result = await syncCaseModelFromNodeODM(caseId);
  if (result.status === "ready") {
    return NextResponse.json({ status: "ready", url: fileUrl });
  }
  return NextResponse.json(result);
}
