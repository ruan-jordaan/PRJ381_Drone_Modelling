import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeModelFromUrl } from "@/lib/storage";

export async function POST(
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

  if (user.role !== "CONTRACTOR") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { caseId } = await params;

  const caseRecord = await prisma.case.findFirst({
    where: {
      id: caseId,
      contractorId: user.id,
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  let body: { modelUrl?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { modelUrl } = body;

  if (typeof modelUrl !== "string" || !modelUrl.trim()) {
    return NextResponse.json(
      { error: "Model URL is required" },
      { status: 400 }
    );
  }

  try {
    const modelKey = await storeModelFromUrl(
      caseId,
      modelUrl
    );

    await prisma.case.update({
      where: {
        id: caseId,
      },
      data: {
        modelUrl: modelKey,
      },
    });

    return NextResponse.json({
      success: true,
      modelKey,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to store model";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}