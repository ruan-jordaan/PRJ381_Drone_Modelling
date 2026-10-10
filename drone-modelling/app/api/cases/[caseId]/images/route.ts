import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ caseId: string }>;
  }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  if (user.role !== UserRole.CONTRACTOR) {
    return NextResponse.json(
      { error: "Only contractors can register case images." },
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
      { error: "Case not found." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const { key, originalFilename } = body;

  if (
    typeof key !== "string" ||
    typeof originalFilename !== "string" ||
    !key ||
    !originalFilename
  ) {
    return NextResponse.json(
      { error: "Image information is incomplete." },
      { status: 400 }
    );
  }

  const image = await prisma.image.create({
    data: {
      caseId,
      url: key,
      originalFilename,
    },
  });

  return NextResponse.json(
    { image },
    { status: 201 }
  );
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ caseId: string }>;
  }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
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
      images: true,
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    images: caseRecord.images,
  }); 
}