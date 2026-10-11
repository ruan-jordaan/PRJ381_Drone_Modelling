import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export async function createUploadUrl(            
  key: string,
  contentType: string
) {
  const command = new PutObjectCommand({          //prepares to upload a file to the R2 bucket
    Bucket: R2_BUCKET_NAME,                       
    Key: key,                                     // file/path name inside R2
    ContentType: contentType,
  });

  return getSignedUrl(r2, command, {             //Creates a secure temporary URL
    expiresIn: 60 * 5,
  });
}

export async function createDownloadUrl(key: string) {           
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2, command, {
    expiresIn: 60 * 5,
  });
}

export function createImageKey(                     
  caseId: string,
  fileName: string
) {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");    //cleans up file name
  const uniqueId = crypto.randomUUID();                              //creates random ID to prevent two files with the same filename from overwriting each other

  return `cases/${caseId}/images/${uniqueId}-${safeFileName}`;      //builds the object for R2
}

export function createModelKey(caseId: string) {
  const uniqueId = crypto.randomUUID();

  return `cases/${caseId}/models/${uniqueId}-model.glb`;
}

export async function uploadModel(
  key: string,
  modelData: Blob | Uint8Array
) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: modelData,
    ContentType: "model/gltf-binary",
  });

  await r2.send(command);
}

export async function storeModelFromUrl(
  caseId: string,
  modelUrl: string
) {
  const response = await fetch(modelUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download 3D model: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const modelData = new Uint8Array(arrayBuffer);

  const key = createModelKey(caseId);

  await uploadModel(key, modelData);

  return key;
}