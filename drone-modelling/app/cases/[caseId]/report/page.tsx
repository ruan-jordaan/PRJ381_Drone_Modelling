import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function ReportPage({ params }: { params: { caseId: string } }) {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950 sm:p-10 flex justify-center">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Draft Report: {params.caseId}
          </h1>
        </header>

        <Card>
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                AI-Drafted Narrative
              </h2>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Review and edit the scene description and sequence of events
                based on the extracted measurements.
              </p>
              <textarea
                className="h-64 w-full rounded-lg border border-black/[.08] bg-transparent p-4 text-sm leading-relaxed outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/30"
                defaultValue="Based on the structured measurements, vehicle A travelled 14.2m after the point of impact..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button className="w-32 !bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900">
                Save Draft
              </Button>
              <Button className="w-48">Approve & Export PDF</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
