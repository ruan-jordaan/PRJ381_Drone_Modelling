"use client";

import { useState } from "react";

export default function ReportFinalization({
  caseId,
  alreadyFinalized,
}: {
  caseId: string;
  alreadyFinalized: boolean;
}) {
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] =
    useState(alreadyFinalized);
  const [message, setMessage] = useState("");

  async function finalizeReport() {
    try {
      setFinalizing(true);
      setMessage("");

      const response = await fetch(
        `/api/cases/${caseId}/report`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to finalize report."
        );
      }

      setFinalized(true);
      setMessage("Report finalized successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to finalize report."
      );
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div className="mt-6 border-t border-black/[.08] pt-6 dark:border-white/[.145]">
      <div className="flex flex-wrap gap-3">
        {!finalized && (
          <button
            onClick={finalizeReport}
            disabled={finalizing}
            className="rounded bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {finalizing
              ? "Generating PDF..."
              : "Finalize & Generate PDF"}
          </button>
        )}

        {finalized && (
          <a
            href={`/api/cases/${caseId}/report`}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-white px-4 py-2 text-sm font-medium text-black"
          >
            View / Download PDF
          </a>
        )}
      </div>

      {message && (
        <p className="mt-3 text-sm text-zinc-500">
          {message}
        </p>
      )}
    </div>
  );
}