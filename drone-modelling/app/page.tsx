import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Link from "next/link";

// Mock data reflecting the workflow statuses
const cases = [
  {
    id: "CAS-2026-09A",
    location: "N1 Highway, Cape Town",
    date: "2026-09-18",
    status: "Report Finalized",
  },
  {
    id: "CAS-2026-09B",
    location: "R44, Stellenbosch",
    date: "2026-09-19",
    status: "Processing",
  },
  {
    id: "CAS-2026-09C",
    location: "Main Rd, Sea Point",
    date: "2026-09-20",
    status: "Uploaded",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans antialiased dark:bg-zinc-950 sm:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Header & Controls */}
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Case Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Manage drone data uploads and 3D accident scene reconstructions.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto md:items-end">
            <div className="w-full sm:w-64">
              <Input
                label="Search Cases"
                id="search"
                placeholder="Case ID or location..."
              />
            </div>
            <div className="w-full sm:w-36">
              <Link href="/cases/new">
                <Button>New Case</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Case Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Card key={c.id}>
              <div className="flex h-full flex-col justify-between gap-6">
                {/* Card Header: ID & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {c.id}
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {c.date}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    {c.status}
                  </span>
                </div>

                {/* Card Body: Location */}
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {c.location}
                  </p>
                </div>

                {/* Card Action */}
                <div className="pt-2">
                  <Link href={`/cases/${c.id}`}>
                    <Button className="!h-9 !bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
