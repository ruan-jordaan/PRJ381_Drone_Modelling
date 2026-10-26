import { NextResponse } from "next/server";
import { syncCaseModelFromNodeODM } from "@/lib/modelExtraction";

export async function POST(request: Request) {
  const caseId = new URL(request.url).searchParams.get("caseId");
  if (!caseId) {
    return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
  }

  await syncCaseModelFromNodeODM(caseId);
  return NextResponse.json({ ok: true });
}
