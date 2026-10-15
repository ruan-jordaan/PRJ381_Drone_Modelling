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

  const imageFiles = files.filter((f) => f.type.startsWith("image/"));

  const UPLOAD_CONCURRENCY = 10;
  const created = [];
  for (let i = 0; i < imageFiles.length; i += UPLOAD_CONCURRENCY) {
    const batch = imageFiles.slice(i, i + UPLOAD_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const key = `cases/${caseId}/${randomUUID()}-${file.name}`;
        const bytes = Buffer.from(await file.arrayBuffer());
        await uploadObject(key, bytes, file.type);
        return prisma.image.create({
          data: { caseId, url: key, originalFilename: file.name },
        });
      })
    );
    created.push(...batchResults);
  }

  if (created.length === 0) {
    return NextResponse.json({ error: "No valid image files" }, { status: 400 });
  }

  return NextResponse.json({ success: true, images: created });
}
