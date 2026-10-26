import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  const body = await request.json();

  const {
    label,
    pointA,
    pointB,
    distanceMeters,
  } = body;

  if (
    typeof label !== "string" ||
    !label.trim() ||
    !Array.isArray(pointA) ||
    !Array.isArray(pointB) ||
    pointA.length !== 3 ||
    pointB.length !== 3 ||
    typeof distanceMeters !== "number"
  ) {
    return NextResponse.json(
      { error: "Invalid measurement data" },
      { status: 400 }
    );
  }

  const measurement = await prisma.measurement.create({
    data: {
      caseId,
      label: label.trim(),

      pointAX: pointA[0],
      pointAY: pointA[1],
      pointAZ: pointA[2],

      pointBX: pointB[0],
      pointBY: pointB[1],
      pointBZ: pointB[2],

      distanceMeters,
    },
  });

  if (
    caseRecord.status === "REPORT_DRAFTED" ||
    caseRecord.status === "REPORT_FINALIZED"
  ) {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        status: "MEASURED",
        narrative: null,
        reportUrl: null,
      },
    });
  }

  return NextResponse.json(
    { measurement },
    { status: 201 }
  );
}

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
      contractorId: user.id,
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  const measurements = await prisma.measurement.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ measurements });
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

  const measurementCount =
    await prisma.measurement.count({
      where: { caseId },
    });

  if (measurementCount === 0) {
    return NextResponse.json(
      { error: "Add at least one measurement first." },
      { status: 400 }
    );
  }

  await prisma.case.update({
    where: { id: caseId },
    data: {
      status: "MEASURED",
    },
  });

  return NextResponse.json({
    success: true,
  });
}