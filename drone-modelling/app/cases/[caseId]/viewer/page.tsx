import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import BackLink from "@/components/BackLink";

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 md:flex-row">
      {/* Canvas Area */}
      <div className="flex-1 bg-zinc-200 dark:bg-zinc-900 relative">
        <div className="absolute left-4 top-4 z-10">
          <BackLink href={`/cases/${caseId}`} label="Case details" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
          [react-three-fiber Canvas Placeholder]
        </div>
      </div>

      {/* Measurement Sidebar */}
      <div className="w-full border-l border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950 md:w-96 overflow-y-auto">
        <h2 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Measurements
        </h2>

        <div className="flex flex-col gap-4">
          {/* Mock Measurement Card */}
          <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Skid Mark A
            </p>
            <div className="mt-2 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>Length:</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                14.2m
              </span>
            </div>
          </div>

          <Button className="mt-4">Save Measurements</Button>
        </div>
      </div>
    </div>
  );
}
