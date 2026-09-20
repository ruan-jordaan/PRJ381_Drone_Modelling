import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function CaseDetailsPage({
  params,
}: {
  params: { caseId: string };
}) {
  const currentStatus = "Uploaded"; // Mock status

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950 sm:p-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {params.caseId}
            </h1>
            <p className="text-sm text-zinc-500">
              N1 Highway, Cape Town • 2026-09-18
            </p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Status: {currentStatus}
          </span>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Processing Actions
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Submit the stored image set to the WebODM instance to generate the
              textured mesh and point cloud.
            </p>
            <Button>Start Photogrammetry Processing</Button>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Review & Analysis
            </h2>
            <div className="flex flex-col gap-3">
              <Link href={`/cases/${params.caseId}/viewer`}>
                <Button className="!bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900">
                  Open 3D Model Viewer
                </Button>
              </Link>
              <Link href={`/cases/${params.caseId}/report`}>
                <Button className="!bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900">
                  View Report Draft
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
