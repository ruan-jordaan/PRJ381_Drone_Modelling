"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
});

type ModelState =
  | { status: "loading" }
  | { status: "not_started" }
  | { status: "processing"; nodeOdmStatusCode: number; progress: number }
  | { status: "ready"; url: string }
  | { status: "error"; message: string };

export default function ModelViewerPane({ caseId }: { caseId: string }) {
  const [state, setState] = useState<ModelState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/cases/${caseId}/model`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setState({ status: "error", message: data.error ?? "Failed to load model" });
          return;
        }

        setState(data);

        if (data.status === "processing" || data.status === "not_started") {
          timer = setTimeout(poll, 5000);
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Failed to reach server" });
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [caseId]);

  if (state.status === "loading") {
    return <Centered>Loading…</Centered>;
  }

  if (state.status === "not_started") {
    return <Centered>Processing hasn&apos;t been started for this case yet.</Centered>;
  }

  if (state.status === "processing") {
    return (
      <Centered>
        Processing in NodeODM… {Math.round(state.progress)}%
      </Centered>
    );
  }

  if (state.status === "error") {
    return <Centered>{state.message}</Centered>;
  }

  return <ModelViewer url={state.url} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
      {children}
    </div>
  );
}
