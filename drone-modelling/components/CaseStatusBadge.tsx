const STYLES: Record<string, { label: string; className: string }> = {
  UPLOADED: { label: "Uploaded", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  PROCESSING: { label: "Processing", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  PROCESSED: { label: "Model ready", className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
  MEASURED: { label: "Measured", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  REPORT_DRAFTED: { label: "Report drafted", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
  REPORT_FINALIZED: { label: "Finalized", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

export default function CaseStatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? { label: status, className: STYLES.UPLOADED.className };
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}
