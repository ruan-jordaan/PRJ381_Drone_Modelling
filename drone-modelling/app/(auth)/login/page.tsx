"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <Card>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Log in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to view your accident cases.
        </p>
        <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex flex-col gap-4">
          <Input id="email" label="Email" type="email" autoComplete="email" required />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Button type="submit" className="mt-2">
            Log in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          No account?{" "}
          <Link href="/register" className="font-medium text-black dark:text-zinc-50">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
