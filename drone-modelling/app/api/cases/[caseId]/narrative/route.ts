import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccidentNarrative } from "@/lib/gemini";

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

  const { caseId } = await params;

  const caseRecord = await prisma.case.findFirst({
    where: {
      id: caseId,
      contractorId: user.id,
    },
    include: {
      measurements: true,
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  if (caseRecord.measurements.length === 0) {
    return NextResponse.json(
      { error: "No measurements available for narrative generation." },
      { status: 400 }
    );
  }

  try {
    const narrative = await generateAccidentNarrative(
      caseRecord.measurements.map((measurement) => ({
        label: measurement.label,
        distanceMeters: measurement.distanceMeters,
      }))
    );

    await prisma.case.update({
      where: { id: caseId },
      data: {
        narrative,
        reportUrl: null,
        status: "REPORT_DRAFTED",
      },
    });

    return NextResponse.json({
      narrative,
    });
  } catch (error) {
    console.error("Narrative generation failed:", error);

    return NextResponse.json(
      { error: "Failed to generate narrative." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      contractorId: user.id,
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  const body = await request.json();

  if (
    typeof body.narrative !== "string" ||
    !body.narrative.trim()
  ) {
    return NextResponse.json(
      { error: "Narrative cannot be empty." },
      { status: 400 }
    );
  }

  const updatedCase = await prisma.case.update({
    where: { id: caseId },
    data: {
      narrative: body.narrative.trim(),
      reportUrl: null,
      status: "REPORT_DRAFTED",
    },
  });

  return NextResponse.json({
    narrative: updatedCase.narrative,
  });
}