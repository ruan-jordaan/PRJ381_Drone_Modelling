import Card from "@/components/ui/Card";
import BackLink from "@/components/BackLink";
import ReportEditor from "@/components/ReportEditor";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const caseData = await prisma.case.findFirst({
    where: {
      id: caseId,
      contractorId: user.id,
    },
  });

  if (!caseData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950 sm:p-10 flex justify-center">
      <div className="w-full max-w-4xl">
        <BackLink
          href={`/cases/${caseId}`}
          label="Case details"
        />

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Draft Report
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {caseData.title}
          </p>
        </header>

        <Card>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            AI-Assisted Narrative
          </h2>

          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Generate, review and edit the narrative before finalizing the report.
          </p>

          <ReportEditor
            caseId={caseId}
            initialNarrative={caseData.narrative}
          />
        </Card>
      </div>
    </div>
  );
}