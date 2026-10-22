import Card from "@/components/ui/Card";
import BackLink from "@/components/BackLink";
import ReportEditor from "@/components/ReportEditor";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReportFinalization from "@/components/ReportFinalization";

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
    include: {
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
      measurements: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!caseData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950 sm:p-10">
      <div className="mx-auto w-full max-w-4xl">
        <BackLink
          href={`/cases/${caseId}`}
          label="Case details"
        />

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Draft Report
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Review the complete report before finalizing.
          </p>
        </header>

        {/* Case Details */}
        <div className="mb-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Case Details
            </h2>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Case ID:</span>{" "}
                {caseData.id}
              </p>

              <p>
                <span className="font-semibold">Title:</span>{" "}
                {caseData.title}
              </p>

              <p>
                <span className="font-semibold">
                  Date Created:
                </span>{" "}
                {caseData.createdAt.toLocaleDateString()}
              </p>

              <p>
                <span className="font-semibold">
                  Description:
                </span>{" "}
                {caseData.description || "No description provided."}
              </p>
            </div>
          </Card>
        </div>

        {/* Parties */}
        <div className="mb-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Parties Involved
            </h2>

            <div className="space-y-4">
              {caseData.parties.map((party, index) => (
                <div
                  key={party.id}
                  className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
                >
                  <p className="font-semibold">
                    Party {index + 1}: {party.name}
                  </p>

                  {party.vehicleRegistration && (
                    <p className="mt-1 text-sm text-zinc-500">
                      Vehicle Registration:{" "}
                      {party.vehicleRegistration}
                    </p>
                  )}

                  {party.contactDetails && (
                    <p className="mt-1 text-sm text-zinc-500">
                      Contact: {party.contactDetails}
                    </p>
                  )}

                  {party.insurer && (
                    <>
                      <p className="mt-1 text-sm text-zinc-500">
                        Insurer: {party.insurer.name}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Insurer Email: {party.insurer.email}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Measurements */}
        <div className="mb-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Scene Measurements
            </h2>

            {caseData.measurements.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No measurements recorded.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.145]">
                <div className="flex bg-zinc-100 px-4 py-3 text-sm font-semibold dark:bg-zinc-900">
                  <span className="flex-1">
                    Measurement
                  </span>

                  <span>Distance</span>
                </div>

                {caseData.measurements.map(
                  (measurement) => (
                    <div
                      key={measurement.id}
                      className="flex border-t border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]"
                    >
                      <span className="flex-1">
                        {measurement.label}
                      </span>

                      <span className="font-mono">
                        {measurement.distanceMeters.toFixed(
                          2
                        )}{" "}
                        m
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </Card>
        </div>

        {/* AI Narrative */}
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            AI-Assisted Summary
          </h2>

          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Review and edit the AI-assisted narrative before
            finalizing the report.
          </p>

          <ReportEditor
            caseId={caseId}
            initialNarrative={caseData.narrative}
          />

          <ReportFinalization
            caseId={caseId}
            alreadyFinalized={
             caseData.status === "REPORT_FINALIZED" &&
             !!caseData.reportUrl
            }
          />
        </Card>
      </div>
    </div>
  );
}