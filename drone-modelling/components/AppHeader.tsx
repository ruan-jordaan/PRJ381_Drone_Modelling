import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function AppHeader() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.145] dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          <span aria-hidden className="text-xl">🚁</span>
          Accident Reports
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden text-right text-sm leading-tight sm:block">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.role === "CONTRACTOR" ? "Contractor" : "Insurer"}
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
