import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createImageKey, createUploadUrl } from "@/lib/storage";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ caseId: string }>;
  }
) {
  const user = await getCurrentUser();      //checks who is currently logged in

  if (!user) {                              
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  if (user.role !== UserRole.CONTRACTOR) {                      //checks users role
    return NextResponse.json(
      { error: "Only contractors can upload case images." },
      { status: 403 }
    );
  }

  const { caseId } = await params;          //gets the case ID from the URL

  const caseRecord = await prisma.case.findFirst({              //checks if case exists and who is logged in
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

    let body: {
    fileName?: string;
    contentType?: string;
  };

  try {
    body = await request.json();          
  } catch {
    return NextResponse.json(
      { error: "Invalid request data." },
      { status: 400 }
    );
  }

  const { fileName, contentType } = body;

    if (
    typeof fileName !== "string" ||
    !fileName.trim() ||
    typeof contentType !== "string" ||
    !["image/jpeg", "image/png"].includes(contentType)
  ) {
    return NextResponse.json(
      { error: "A valid JPEG or PNG image is required." },
      { status: 400 }
    );
  }

  const key = createImageKey(caseId, fileName);         //creates the safe and unique R2 path for the image
  const uploadUrl = await createUploadUrl(key, contentType);     //creates the temporary permission link

  return NextResponse.json({      //just sends the values back to the browser
    key,
    uploadUrl,
  });
}


