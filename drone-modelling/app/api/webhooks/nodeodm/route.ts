import { NextResponse } from "next/server";
import { syncCaseModelFromNodeODM } from "@/lib/modelExtraction";

// NodeODM POSTs here when a task finishes (success or failure) — see the
// `webhook` field passed in lib/nodeodm.ts's createNodeODMTask. We don't
// trust whatever NodeODM puts in the POST body for anything beyond "a task
// finished, go look"; the real status comes from re-polling NodeODM's own
// /task/{id}/info inside syncCaseModelFromNodeODM, the same function the
// viewer's poll route uses. That keeps one source of truth for "is this
// task actually done" instead of parsing two different payload shapes.
//
// No auth beyond knowing the caseId in the URL — fine for a local-only dev
// setup where NodeODM and the app share a machine. If this app is ever
// exposed beyond localhost, this route needs a shared-secret check before
// trusting an incoming "task done" ping.
export async function POST(request: Request) {
  const caseId = new URL(request.url).searchParams.get("caseId");
  if (!caseId) {
    return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
  }

  await syncCaseModelFromNodeODM(caseId);
  return NextResponse.json({ ok: true });
}
