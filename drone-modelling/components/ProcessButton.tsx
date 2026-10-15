"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type ProcessStatus = "idle" | "processing" | "success";

export default function ProcessButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [error, setError] = useState("");

  const handleStart = async () => {
    setStatus("processing");
    setError("");

    try {
      const res = await fetch(`/api/cases/${caseId}/process`, { method: "POST" });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Processing failed to start" }));
        throw new Error(error ?? "Processing failed to start");
      }

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed to start");
      setStatus("idle");
    }
  };

  return (
    <div>
      <Button type="button" onClick={handleStart} disabled={status === "processing"}>
        Start Photogrammetry Processing
      </Button>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <div className="flex w-72 flex-col items-center gap-4 rounded-2xl border border-black/[.08] bg-white p-8 text-center shadow-xl dark:border-white/[.145] dark:bg-zinc-900">
            {status === "processing" ? (
              <>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Starting NodeODM task...
                </p>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Processing started
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  NodeODM is now generating the 3D model. This can take a while.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    router.refresh();
                  }}
                  className="!h-9 !w-auto px-5"
                >
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
