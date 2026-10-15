const NODEODM_URL = process.env.NODEODM_URL || "http://localhost:3000";
const UPLOAD_BATCH_SIZE = 15;

export interface NodeODMTaskStatus {
  taskId: string;
  status: {
    code: number;
  };
  progress: number;
}

async function initNodeODMTask(webhookUrl?: string): Promise<string> {
  const formData = new FormData();
  formData.append(
    "options",
    JSON.stringify([
      { name: "max-concurrency", value: 6 },
      { name: "pc-quality", value: "high" },
      { name: "feature-quality", value: "high" },
      { name: "skip-orthophoto", value: true },
      { name: "skip-report", value: true },
      { name: "auto-boundary", value: true },
      { name: "sky-removal", value: true },
    ]),
  );
  // NodeODM POSTs to this URL (with the task's status, same shape as
  // /task/{id}/info) when the task finishes — see app/api/webhooks/nodeodm.
  if (webhookUrl) {
    formData.append("webhook", webhookUrl);
  }

  const response = await fetch(`${NODEODM_URL}/task/new/init`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`NodeODM task init failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.uuid;
}

async function uploadNodeODMBatch(
  uuid: string,
  imageUrls: string[],
  startIndex: number,
): Promise<void> {
  const formData = new FormData();

  for (let i = 0; i < imageUrls.length; i++) {
    const res = await fetch(imageUrls[i]);
    const blob = await res.blob();
    formData.append("images", blob, `image_${startIndex + i}.jpg`);
  }

  const response = await fetch(`${NODEODM_URL}/task/new/upload/${uuid}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `NodeODM batch upload failed for task ${uuid}: ${response.statusText}`,
    );
  }
}

async function commitNodeODMTask(uuid: string): Promise<void> {
  const response = await fetch(`${NODEODM_URL}/task/new/commit/${uuid}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `NodeODM task commit failed for task ${uuid}: ${response.statusText}`,
    );
  }
}

export async function createNodeODMTask(
  imageUrls: string[],
  webhookUrl?: string,
): Promise<string> {
  const uuid = await initNodeODMTask(webhookUrl);

  for (let i = 0; i < imageUrls.length; i += UPLOAD_BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + UPLOAD_BATCH_SIZE);
    await uploadNodeODMBatch(uuid, batch, i);
  }

  await commitNodeODMTask(uuid);
  return uuid;
}

export async function getNodeODMTaskStatus(
  uuid: string,
): Promise<NodeODMTaskStatus> {
  const response = await fetch(`${NODEODM_URL}/task/${uuid}/info`);
  if (!response.ok) {
    throw new Error(`Failed to fetch status for task ${uuid}`);
  }
  const data = await response.json();
  // NodeODM returns 200 OK with { error: "..." } (no `status` field) for a
  // task ID it doesn't recognize, instead of a 4xx — catch that explicitly
  // rather than letting callers crash on `.status.code`.
  if (!data.status || data.error) {
    throw new Error(
      `NodeODM does not recognize task ${uuid}: ${data.error ?? "no status in response"}`,
    );
  }
  return {
    taskId: data.uuid,
    status: data.status,
    progress: data.progress,
  };
}

export function getNodeODMResultUrl(taskId: string): string {
  return `${NODEODM_URL}/task/${taskId}/download/all.zip`;
}
