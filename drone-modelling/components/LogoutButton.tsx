"use client";

import { useRouter } from "next/navigation";
import Button from "./ui/Button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      onClick={handleLogout}
      className="!h-9 !w-auto !bg-transparent !text-zinc-900 border border-black/[.08] px-4 hover:!bg-zinc-100 dark:!text-zinc-100 dark:border-white/[.145] dark:hover:!bg-zinc-900"
    >
      Log out
    </Button>
  );
}
