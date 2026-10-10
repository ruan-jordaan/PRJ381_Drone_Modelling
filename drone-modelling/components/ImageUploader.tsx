"use client";

import { useState } from "react";

type ImageUploaderProps = {
  caseId: string;
};

export default function ImageUploader({ caseId }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
  }

  async function handleUpload() {
  for (const file of files) {
    const response = await fetch(`/api/cases/${caseId}/upload`, {         //asks the backend for a presigned R2 upload URL
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
          className="inline-flex w-fit rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Upload Images
        </button>
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