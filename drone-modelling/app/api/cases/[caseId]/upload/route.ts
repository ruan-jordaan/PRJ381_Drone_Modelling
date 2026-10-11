import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/storage";

export async function POST(
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
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("images").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No images provided" }, { status: 400 });
  }

  const created = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const key = `cases/${caseId}/${randomUUID()}-${file.name}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await uploadObject(key, bytes, file.type);

    const image = await prisma.image.create({
      data: {
        caseId,
        url: key,
        originalFilename: file.name,
      },
    });
    created.push(image);
  }

  if (created.length === 0) {
    return NextResponse.json({ error: "No valid image files" }, { status: 400 });
  }

  return NextResponse.json({ success: true, images: created });
}
