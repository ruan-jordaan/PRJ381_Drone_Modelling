// One-off: clear a stale/mock Case.modelUrl so GET /api/cases/[id]/model
// re-runs the real NodeODM-extract -> R2-upload path instead of serving a
// signed URL for a key that was never actually uploaded.
//
// Usage: node scripts/reset-case-model.mjs <caseId>
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const caseId = process.argv[2];
if (!caseId) {
  console.error("Usage: node scripts/reset-case-model.mjs <caseId>");
  process.exit(1);
}

const prisma = new PrismaClient();
const before = await prisma.case.findUnique({ where: { id: caseId } });
if (!before) {
  console.error("No case found with id", caseId);
  process.exit(1);
}
console.log("Before:", { modelUrl: before.modelUrl, status: before.status, nodeOdmTaskId: before.nodeOdmTaskId });

await prisma.case.update({
  where: { id: caseId },
  data: { modelUrl: null },
});

console.log("Cleared modelUrl. Reload the viewer page to trigger a real extract+upload.");
await prisma.$disconnect();
