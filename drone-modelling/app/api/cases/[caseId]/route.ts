import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  /*
   * Contractors can access their own cases.
   *
   * Insurance users can only access:
   * 1. Cases where they are assigned as the insurer
   * 2. Cases that have been finalized
   */
  const accessFilter =
    user.role === UserRole.CONTRACTOR
      ? {
          id: caseId,
          contractorId: user.id,
        }
      : {
          id: caseId,
          status: "REPORT_FINALIZED" as const,
          parties: {
            some: {
              insurerId: user.id,
            },
          },
        };

  const caseRecord = await prisma.case.findFirst({
    where: accessFilter,

    include: {
      parties: true,
      images: true,
      measurements: true,
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    case: caseRecord,
  });
}