import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { caseReadWhere } from "@/lib/caseAccess";
import MeasurementViewer from "@/components/MeasurementViewer";

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const user = await getCurrentUser();
  const allowed = user
    ? await prisma.case.findFirst({
        where: caseReadWhere(user, caseId),
        select: { id: true },
      })
    : null;
  if (!user || !allowed) notFound();

  return (
    <MeasurementViewer
      caseId={caseId}
      readOnly={user.role !== UserRole.CONTRACTOR}
    />
  );
}
