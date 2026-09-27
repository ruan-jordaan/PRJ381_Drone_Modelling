# File Structure

This maps every file/folder added to `drone-modelling/` to what it will do, following the
architecture decisions in the project's `architecture-insights.md`: Next.js is the
orchestration layer around four external/independent systems (Postgres via Prisma, NodeODM,
R2 object storage, OpenAI), the report is a deterministic measurement layer plus a
clearly-separated AI narrative layer, and capture is manual (upload only, no drone SDK).

Files marked **(existing)** were already in the scaffold from the structure session; everything
else is new. All files are currently empty — no code yet.

## Root

- **`middleware.ts`** — Next.js middleware that runs before every request. Will check for a
  valid session and redirect unauthenticated users away from `/cases/*` to `/login`.
- **`.env.example`** — Documents every environment variable the app needs without committing
  secrets: `DATABASE_URL`, `NODEODM_URL`, R2 credentials/bucket name, `OPENAI_API_KEY`, auth
  secret/provider keys. Copied to `.env.local` by each developer.
- **`docker/docker-compose.yml`** — Spins up NodeODM as a local Docker service (per the "run it
  locally alongside the dev server" decision). One service definition, exposed on the port
  `lib/nodeodm.ts` talks to.

## `prisma/`

- **`schema.prisma`** — The single source of truth for the data model: `User` → `Case` →
  `Image` / `Measurement`, plus the `Case.status` enum (`Uploaded` → `Processing` →
  `Processed` → `Measured` → `Report Drafted` → `Report Finalized`). Targets SQLite locally,
  Postgres (Neon/Supabase) in production, per the resolved DB choice. Holds URLs to
  R2-stored files, never binary data.
- **`seed.ts`** — Optional script to populate local SQLite with a fake case/user for UI
  development without needing a real drone upload or NodeODM run every time.

## `types/`

Shared TypeScript types used across API routes, components, and hooks, kept intentionally
narrow (type only the fields actually read, per the architecture notes).

- **`case.ts`** — `Case` shape and the status-enum union, matching the Prisma model.
- **`nodeodm.ts`** — Minimal typed slice of NodeODM's `/task/{uuid}/info` response (e.g.
  `status.code`, `processingTime`) — not the whole payload.
- **`measurement.ts`** — A single measurement record: two 3D points, computed distance, label,
  who/when it was taken.
- **`report.ts`** — The shape passed into the PDF renderer: case metadata, measurement table
  rows, orthophoto reference, and the AI narrative text.

## `lib/`

Framework-agnostic logic and external-service clients, importable from both API routes and
server components.

- **`prisma.ts`** — Singleton Prisma client (avoids exhausting DB connections from hot-reload
  in dev).
- **`auth.ts`** — Auth configuration/session helpers (provider setup, password hashing or
  OAuth config, `getSession`-style helper used by API routes and `middleware.ts`).
- **`nodeodm.ts`** — Thin REST client for NodeODM: `submitTask()` (`POST /task/new` with the
  image set), `getTaskInfo()` (`GET /task/{uuid}/info` for polling), `downloadResult()`
  (`GET /task/{uuid}/download/all.zip` to pull the textured `.glb` once done).
- **`storage.ts`** — R2/S3 client: generates presigned PUT URLs so the browser uploads images
  directly to object storage (never routed through the Next.js server), and presigned GET URLs
  for reading them back.
- **`openai.ts`** — OpenAI client plus the prompt template that turns structured measurement
  numbers into narrative report text. Receives only numbers/labels as text — never the mesh or
  point cloud — and returns only a narrative paragraph, never the assembled PDF.
- **`measurements.ts`** — Client-side geometry helpers, primarily `Vector3.distanceTo()` on two
  user-picked points in the loaded `.glb` (per the decision that no Python/PDAL service is
  needed for this phase).
- **`validation.ts`** — Zod (or similar) schemas validating API route input (case creation,
  measurement submission, upload registration) before it touches Prisma or NodeODM.
- **`constants.ts`** — Shared constants: the case-status enum values in display order, NodeODM
  config defaults, upload size/type limits.
- **`pdf/AccidentReportDocument.tsx`** — The `@react-pdf/renderer` document template: case
  metadata table, orthophoto placeholder, measurement table, and a distinctly-labeled
  "AI-assisted narrative" panel, matching the sample report output.

## `hooks/`

- **`useCaseUpload.ts`** (existing) — Drives the manual image-batch upload flow: gets presigned
  URLs, uploads files to R2, then registers each `Image` record against the case.
- **`useMeasurements.ts`** (existing) — Manages the list of click-to-measure points/distances
  for the active viewer session and persists them via the measurements API.
- **`useCaseStatus.ts`** — Polls `GET /api/cases/[caseId]/process` (or the case record) on an
  interval while a case is `Processing`, so the UI can show live progress without a webhook.

## `components/`

- **`ImageUploader.tsx`** (existing) — Drag-and-drop/file-picker UI for the manual image batch,
  wired to `useCaseUpload`.
- **`ModelViewer.tsx`** (existing) — react-three-fiber viewer that loads the processed `.glb`
  at real-world scale.
- **`MeasurementTool.tsx`** (existing) — Click-to-measure overlay on top of `ModelViewer`, using
  `useMeasurements` and `lib/measurements.ts`.
- **`ReportEditor.tsx`** (existing) — Review/edit screen for the AI-drafted narrative before
  final PDF export, keeping the AI text visibly separate from the measurement data.
- **`CaseCard.tsx`** — Summary card for one case in the case list/dashboard (name, status badge,
  last updated).
- **`CaseStatusBadge.tsx`** — Small colored badge rendering the current status-enum value
  consistently wherever a case is shown.
- **`ProcessingProgress.tsx`** — Progress indicator bound to `useCaseStatus`, shown while
  NodeODM is processing a case.
- **`ui/Button.tsx`, `ui/Input.tsx`, `ui/Card.tsx`** — Small shared primitives so forms
  (login, register, new case) and cards don't each redefine basic styling.

## `app/(auth)/`

Route group (no URL segment) for unauthenticated pages.

- **`login/page.tsx`** — Login form, posts to the auth provider configured in `lib/auth.ts`.
- **`register/page.tsx`** — Account creation form, creates a `User` row via Prisma.

## `app/cases/`

- **`page.tsx`** — Dashboard: lists the signed-in user's cases using `CaseCard`, with a link to
  create a new one.
- **`new/page.tsx`** (existing) — Case-creation form (name, description, accident metadata) →
  `POST /api/cases`.
- **`[caseId]/page.tsx`** (existing) — Single case overview: current status, links into upload,
  viewer, and report depending on where the case is in the pipeline.
- **`[caseId]/upload/page.tsx`** — Manual image-batch upload screen for that case, hosting
  `ImageUploader`; on completion triggers processing (`POST /api/cases/[caseId]/process`).
- **`[caseId]/viewer/page.tsx`** (existing) — Hosts `ModelViewer` + `MeasurementTool` once the
  case is `Processed`, for reviewing the model and recording measurements.
- **`[caseId]/report/page.tsx`** (existing) — Hosts `ReportEditor` for reviewing/editing the AI
  narrative and triggering the final PDF export.

## `app/api/`

Server-side route handlers — the "backend" layer, since NodeODM/OpenAI/storage are called from
here, never from the browser directly (except presigned image uploads).

- **`auth/[...nextauth]/route.ts`** — Auth provider's catch-all route handler (session/login/
  logout endpoints), configured via `lib/auth.ts`.
- **`cases/route.ts`** — `POST` creates a new `Case` (status `Uploaded`); `GET` lists the
  signed-in user's cases.
- **`cases/[caseId]/route.ts`** — `GET` fetches one case with its images/measurements; `PATCH`
  updates status/metadata.
- **`cases/[caseId]/upload/route.ts`** — Issues presigned R2 upload URLs and, once the browser
  finishes uploading, registers each resulting `Image` row against the case.
- **`cases/[caseId]/process/route.ts`** — `POST` submits the case's images to NodeODM
  (`submitTask`) and moves status to `Processing`; `GET` polls NodeODM (`getTaskInfo`) and
  updates status to `Processed` once the job completes, storing the result URL.
- **`cases/[caseId]/model/route.ts`** — Proxies/serves the processed `.glb` (downloaded from
  NodeODM via `downloadResult`, or its R2 copy) to the viewer.
- **`cases/[caseId]/measurements/route.ts`** — CRUD for measurement records taken in the
  viewer; moves status to `Measured` once at least one exists.
- **`cases/[caseId]/narrative/route.ts`** — `POST` sends the case's measurements to
  `lib/openai.ts` and stores the returned narrative text; moves status to `Report Drafted`.
- **`cases/[caseId]/report/route.ts`** — `POST` assembles `lib/pdf/AccidentReportDocument.tsx`
  with the case's metadata, measurements, and narrative, and returns the generated PDF; moves
  status to `Report Finalized`.
