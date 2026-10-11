import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import BackLink from "@/components/BackLink";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, CaseStatus } from "@prisma/client";

export default async function CaseDetailsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  // Get the case while applying the same access rules
  // used by the case API.
  const caseData = await prisma.case.findFirst({
    where: {
      id: caseId,

      OR: [
        // Contractors can view their own cases
        ...(user.role === UserRole.CONTRACTOR
          ? [{ contractorId: user.id }]
          : []),

        // Insurance users can only view finalized cases
        // where they are assigned as the insurer.
        ...(user.role === UserRole.INSURANCE
          ? [
              {
                status: CaseStatus.REPORT_FINALIZED,
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
    include: {
      parties: {
        include: {
          insurer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      images: true,
      measurements: true,
    },
  });

  if (!caseData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950 sm:p-10">
      <div className="mx-auto max-w-4xl">
        <BackLink href="/" label="Dashboard" />

        {/* Case Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {caseData.title}
            </h1>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {caseData.createdAt.toLocaleDateString()}
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Status: {caseData.status}
          </span>
        </header>

        {/* Case Description */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Case Description
          </h2>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {caseData.description || "No description provided."}
          </p>
        </Card>

        {/* Parties */}
        <div className="mt-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Parties Involved
            </h2>

            <div className="space-y-4">
              {caseData.parties.map((party) => (
                <div
                  key={party.id}
                  className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {party.name}
                  </p>

                  {party.vehicleRegistration && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Vehicle: {party.vehicleRegistration}
                    </p>
                  )}

                  {party.contactDetails && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Contact: {party.contactDetails}
                    </p>
                  )}

                  {party.insurer && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Insurer: {party.insurer.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Processing and Review */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Processing Actions
            </h2>

            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Submit the stored image set to NodeODM to generate the textured
              mesh and point cloud.
            </p>

            <Button>
              Start Photogrammetry Processing
            </Button>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Review & Analysis
            </h2>

            <div className="flex flex-col gap-3">
              <Link href={`/cases/${caseId}/viewer`}>
                <Button
                  className="!bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900"
                >
                  Open 3D Model Viewer
                </Button>
              </Link>

              <Link href={`/cases/${caseId}/report`}>
                <Button
                  className="!bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900"
                >
                  View Report Draft
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Image Upload - placeholder for our next step */}
        <div className="mt-6">
          <Card>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Accident Images
            </h2>

            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Image uploading will be connected here next.
            </p>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
              Images currently stored: {caseData.images.length}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
