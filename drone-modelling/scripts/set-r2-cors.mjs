// One-off: allow the browser to fetch presigned GET URLs from R2 (needed for
// the 3D viewer, which loads the .glb client-side via fetch()). Run once:
//   node scripts/set-r2-cors.mjs
import "dotenv/config";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

await s3.send(
  new PutBucketCorsCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ["http://localhost:3000", "http://localhost:3001"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  })
);

const current = await s3.send(new GetBucketCorsCommand({ Bucket: process.env.R2_BUCKET_NAME }));
console.log("CORS set on bucket:", process.env.R2_BUCKET_NAME);
console.log(JSON.stringify(current.CORSRules, null, 2));
