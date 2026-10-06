import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import LogoutButton from "../components/LogoutButton";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, CaseStatus } from "@prisma/client";

type DashboardProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function Dashboard({
  searchParams,
}: DashboardProps) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const isContractor = user.role === UserRole.CONTRACTOR;

  const params = await searchParams;
  const search = params.search?.trim() || "";

  // Build the case access filter first.
  const accessFilter = isContractor
    ? {
        contractorId: user.id,
      }
    : {
        status: CaseStatus.REPORT_FINALIZED,
        parties: {
          some: {
            insurerId: user.id,
          },
        },
      };

  // Add search filtering only when a search term exists.
  const searchFilter = search
    ? {
        OR: [
          {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            id: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            parties: {
              some: {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    vehicleRegistration: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    contactDetails: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            },
          },
        ],
      }
    : {};

  const cases = await prisma.case.findMany({
    where: {
      AND: [accessFilter, searchFilter],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      parties: true,
    },
  });

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

            {/* Search */}
            <form
              method="GET"
              className="w-full sm:w-64"
            >
              <Input
                label="Search Cases"
                id="search"
                name="search"
                placeholder="Search cases..."
                defaultValue={search}
              />

              <div className="mt-2 flex gap-2">
                <Button
                  type="submit"
                  className="!h-9"
                >
                  Search
                </Button>

                {search && (
                  <Link href="/">
                    <Button
                      type="button"
                      className="!h-9 !bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900"
                    >
                      Clear
                    </Button>
                  </Link>
                )}
              </div>
            </form>

            {isContractor && (
              <div className="w-full sm:w-36">
                <Link href="/cases/new">
                  <Button>New Case</Button>
                </Link>
              </div>
            )}

            <LogoutButton />
          </div>
        </header>

        {/* Search Information */}
        {search && (
          <div className="mb-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing results for:{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                "{search}"
              </span>
            </p>
          </div>
        )}

        {/* Case Grid */}
        {cases.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {search ? "No matching cases found" : "No cases found"}
              </h2>

              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {search
                  ? `No cases matched "${search}". Try a different search term.`
                  : isContractor
                    ? "Create a new case to get started."
                    : "There are currently no finalized cases assigned to you."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {cases.map((c) => (
              <Card key={c.id}>
                <div className="flex h-full flex-col justify-between gap-6">

                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">

                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {c.title}
                      </h2>

                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                      {c.status.replaceAll("_", " ")}
                    </span>

                  </div>

                  {/* Card Body */}
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {c.description || "No description provided."}
                    </p>
                  </div>

                  {/* Card Action */}
                  <div className="pt-2">
                    <Link href={`/cases/${c.id}`}>
                      <Button
                        className="!h-9 !bg-transparent !text-zinc-900 border border-black/[.08] hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>

                </div>
              </Card>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}
