"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type UploadStatus = "idle" | "uploading" | "success";

export default function ImageUploader({ caseId }: { caseId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
    setError("");
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setStatus("uploading");
    setError("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));
      const [res] = await Promise.all([
        fetch(`/api/cases/${caseId}/upload`, { method: "POST", body: formData }),
        minDelay,
      ]);

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error ?? "Upload failed");
      }

      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("idle");
    }
  };

  return (
    <div className="mt-4">
      <input
        ref={inputRef}
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          htmlFor="image-upload"
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border border-black/[.08] px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-white/[.145] dark:text-zinc-100 dark:hover:bg-zinc-900 sm:w-auto"
        >
          Choose Images
        </label>

        <Button
          type="button"
          onClick={handleUpload}
          disabled={files.length === 0 || status === "uploading"}
          className="!w-full sm:!w-auto sm:px-6"
        >
          Upload{files.length ? ` (${files.length})` : ""}
        </Button>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
          {files.map((file, i) => (
            <li key={i}>{file.name}</li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <div className="flex w-72 flex-col items-center gap-4 rounded-2xl border border-black/[.08] bg-white p-8 text-center shadow-xl dark:border-white/[.145] dark:bg-zinc-900">
            {status === "uploading" ? (
              <>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Uploading images...
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
                  Upload complete
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
