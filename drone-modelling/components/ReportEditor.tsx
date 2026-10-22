"use client";

import { useState } from "react";

export default function ReportEditor({
  caseId,
  initialNarrative,
}: {
  caseId: string;
  initialNarrative?: string | null;
}) {
  const [narrative, setNarrative] = useState(initialNarrative ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  async function generateNarrative() {
    try {
      setGenerating(true);
      setMessage("");

      const response = await fetch(
        `/api/cases/${caseId}/narrative`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate narrative."
        );
      }

      setNarrative(data.narrative);
      setMessage("Narrative generated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate narrative."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function saveNarrative() {
    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/cases/${caseId}/narrative`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            narrative,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save narrative."
        );
      }

      setMessage("Narrative saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save narrative."
      );
    } finally {
      setSaving(false);
    }
  }

  async function finalizeReport() {
   if (!narrative.trim()) {
     setMessage("Narrative cannot be empty.");
     return;
   }

   try {
     setFinalizing(true);
     setMessage("");

     const saveResponse = await fetch(
       `/api/cases/${caseId}/narrative`,
       {
         method: "PATCH",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           narrative,
         }),
       }
     );

     const saveData = await saveResponse.json();

     if (!saveResponse.ok) {
       throw new Error(
         saveData.error || "Failed to save narrative."
       );
     }

     const reportResponse = await fetch(
       `/api/cases/${caseId}/report`,
       {
         method: "POST",
       }
     );

     const reportData = await reportResponse.json();

     if (!reportResponse.ok) {
       throw new Error(
         reportData.error || "Failed to finalize report."
       );
     }

     setFinalized(false);
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
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={generateNarrative}
          disabled={generating}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {generating
            ? "Generating..."
            : narrative
              ? "Regenerate Narrative"
              : "Generate Narrative"}
        </button>

        <button
          onClick={saveNarrative}
          disabled={saving || !narrative.trim()}
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {saving ? "Saving..." : "Save Narrative"}
        </button>

        <button
         onClick={finalizeReport}
         disabled={finalizing || !narrative.trim()}
         className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {finalizing
            ? "Generating PDF..."
            : finalized
              ? "Report Finalized"
              : "Finalize & Generate PDF"}
          </button>
      </div>

      <textarea
        value={narrative}
        onChange={(event) =>
          setNarrative(event.target.value)
        }
        placeholder="Generate or enter the accident narrative..."
        rows={10}
        className="w-full rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      {finalized && (
        <a
         href={`/api/cases/${caseId}/report`}
         target="_blank"
         rel="noreferrer"
         className="inline-block rounded bg-white px-4 py-2 text-sm font-medium text-black"
        >
         View / Download PDF
       </a>
      )}

      {message && (
        <p className="text-sm text-zinc-500">
          {message}
        </p>
      )}
    </div>
  );
}