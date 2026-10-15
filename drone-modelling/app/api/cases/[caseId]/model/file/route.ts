import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectBytes, objectExists } from "@/lib/storage";

// Streams the stored .glb through our own server instead of redirecting the
// browser to a direct R2 URL. The /model route already confirmed our server
// can reach R2 fine (extraction + upload succeed); this just reuses that same
// working server-side path for the download too, so the browser never has to
// talk to r2.cloudflarestorage.com itself.
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
  if (!caseRecord?.modelUrl || !(await objectExists(caseRecord.modelUrl))) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const { body, contentType } = await getObjectBytes(caseRecord.modelUrl);
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType ?? "model/gltf-binary",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
