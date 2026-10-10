"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImageUploaderProps = {
  caseId: string;
};

export default function ImageUploader({ caseId }: ImageUploaderProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
  }

  async function handleUpload() {
  try {
    setUploading(true);
    setMessage("");

    for (const file of files) {
      const response = await fetch(`/api/cases/${caseId}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare image upload.");
      }

      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${file.name}.`);
      }

      const registerResponse = await fetch(
        `/api/cases/${caseId}/images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: data.key,
            originalFilename: file.name,
          }),
        }
      );

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.error || `Failed to register ${file.name}.`
        );
      }
    }

    setFiles([]);
    setMessage("Upload complete.");
    router.refresh();
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Upload failed."
    );
  } finally {
    setUploading(false);
  }
}

  return (
    <div className="flex flex-col gap-4">
      <label className="inline-flex w-fit cursor-pointer items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
       Choose Images

        <input
         type="file"
         accept="image/jpeg,image/png"
         multiple
         onChange={handleFileChange}
         className="hidden"
        />
     </label>

       {files.length > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="inline-flex w-fit rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Images"}
        </button>)}

        {message && (
          <p className="text-sm text-zinc-400">
            {message}
          </p>
        )}
     

      {files.length > 0 && (
        <div className="text-sm">
          <p className="font-medium">
            Selected images: {files.length}
          </p>

          <ul className="mt-2 list-disc pl-5">
            {files.map((file) => (
              <li key={`${file.name}-${file.lastModified}`}>
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}