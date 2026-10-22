import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadObject, getObjectBytes } from "@/lib/storage";
import AccidentReportDocument from "@/lib/pdf/AccidentReportDocument";
import { UserRole } from "@prisma/client";

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
      parties: {
        include: {
          insurer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!caseRecord) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  if (!caseRecord.narrative) {
    return NextResponse.json(
      { error: "Generate and save the narrative first." },
      { status: 400 }
    );
  }

  if (caseRecord.measurements.length === 0) {
    return NextResponse.json(
      { error: "No measurements found for this case." },
      { status: 400 }
    );
  }

  try {
    const document = createElement(
      AccidentReportDocument,
      {
        caseId: caseRecord.id,
        title: caseRecord.title,
        description: caseRecord.description,
        createdAt: caseRecord.createdAt,
        parties: caseRecord.parties,
        measurements: caseRecord.measurements,
        narrative: caseRecord.narrative,
      }
    );

    const pdfBuffer = await renderToBuffer(document);

    const reportKey = `cases/${caseId}/report.pdf`;

    await uploadObject(
      reportKey,
      pdfBuffer,
      "application/pdf"
    );

    await prisma.case.update({
      where: {
        id: caseId,
      },
      data: {
        reportUrl: reportKey,
        status: "REPORT_FINALIZED",
      },
    });

    return NextResponse.json({
      success: true,
      reportUrl: reportKey,
    });
  } catch (error) {
    console.error(
      "Report generation failed:",
      error
    );

    return NextResponse.json(
      { error: "Failed to generate report." },
      { status: 500 }
    );
  }
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

      OR: [
        ...(user.role === UserRole.CONTRACTOR
          ? [{ contractorId: user.id }]
          : []),

        ...(user.role === UserRole.INSURANCE
          ? [
              {
                status: "REPORT_FINALIZED" as const,
                parties: {
                  some: {
                    insurerId: user.id,
                  },
                },
              },
            ]
          : []),
      ],
    },
  });

  if (!caseRecord?.reportUrl) {
    return NextResponse.json(
      { error: "Report not found." },
      { status: 404 }
    );
  }

  try {
    const { body } = await getObjectBytes(
      caseRecord.reportUrl
    );

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="accident-report-${caseId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to load report:", error);

    return NextResponse.json(
      { error: "Failed to load report." },
      { status: 500 }
    );
  }
} 