import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caseReadWhere } from "@/lib/caseAccess";
import { getObjectBytes, objectExists } from "@/lib/storage";

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
  if (!caseRecord?.modelUrl || !(await objectExists(caseRecord.modelUrl))) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const { body, contentType } = await getObjectBytes(caseRecord.modelUrl);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": contentType ?? "model/gltf-binary",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
