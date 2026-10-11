import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl } from "@/lib/storage";



export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { caseId } = await params;

  const caseRecord = await prisma.case.findFirst({
    where: {
      id: caseId,
      OR: [
        {
          contractorId: user.id,
        },
        {
          status: "REPORT_FINALIZED",
          parties: {
            some: {
              insurerId: user.id,
            },
          },
        },
      ],
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  if (!caseRecord.modelUrl) {
    return NextResponse.json(
      { error: "No 3D model available for this case" },
      { status: 404 }
    );
  }

  const downloadUrl = await createDownloadUrl(
    caseRecord.modelUrl
  );

  return NextResponse.json({
    modelUrl: downloadUrl,
  });
}