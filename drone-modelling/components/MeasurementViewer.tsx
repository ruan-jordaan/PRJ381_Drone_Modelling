"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import ModelViewerPane from "@/components/ModelViewerPane";
import BackLink from "@/components/BackLink";

type Point3D = [number, number, number];

type SavedMeasurement = {
  id: string;
  label: string;
  distanceMeters: number;
};

export default function MeasurementViewer({
  caseId,
  readOnly = false,
}: {
  caseId: string;
  readOnly?: boolean;
}) {
  const [pointA, setPointA] = useState<Point3D | null>(null);
  const [pointB, setPointB] = useState<Point3D | null>(null);

  const [measuring, setMeasuring] = useState(false);

  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false); 

  const [measurements, setMeasurements] =
    useState<SavedMeasurement[]>([]);

  const distance =
    pointA && pointB
      ? new THREE.Vector3(...pointA).distanceTo(
          new THREE.Vector3(...pointB)
        )
      : null;

  useEffect(() => {
    async function loadMeasurements() {
      try {
        const response = await fetch(
          `/api/cases/${caseId}/measurements`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load measurements."
          );
        }

        setMeasurements(data.measurements ?? []);
      } catch (error) {
        console.error(error);
      }
    }

    loadMeasurements();
  }, [caseId]);

  function handlePointSelected(point: Point3D) {
    if (!measuring) return;

    if (!pointA) {
      setPointA(point);
      setPointB(null);
      return;
    }

    if (!pointB) {
      setPointB(point);
      return;
    }

    setPointA(point);
    setPointB(null);
  }

  async function saveMeasurement() {
    if (!pointA || !pointB || distance === null) {
      return;
    }

    if (!label.trim()) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/cases/${caseId}/measurements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            label,
            pointA,
            pointB,
            distanceMeters: distance,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save measurement."
        );
      }

      setMeasurements((current) => [
        ...current,
        data.measurement,
      ]);

      setLabel("");
      setPointA(null);
      setPointB(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function finishMeasuring() {
   try {
     setFinishing(true);

     const response = await fetch(
       `/api/cases/${caseId}/measurements`,
       {
         method: "PATCH",
       }
     );

     const data = await response.json();

     if (!response.ok) {
       throw new Error(
         data.error || "Failed to finish measuring."
       );
     }

     setFinished(true);
     setMeasuring(false);
     setPointA(null);
     setPointB(null);
     setLabel("");
    } catch (error) {
      console.error(error);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* 3D Viewer */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute left-4 top-4 z-20">
          <BackLink
            href={`/cases/${caseId}`}
            label="Case details"
          />
        </div>

        {!readOnly && (
          <button
            onClick={() => {
              setMeasuring((current) => !current);
              setPointA(null);
              setPointB(null);
              setLabel("");
            }}
            className="absolute left-4 top-16 z-20 rounded bg-white px-4 py-2 text-sm font-medium text-black shadow"
          >
            {measuring
              ? "Exit Measure Mode"
              : "Start Measuring"}
          </button>
        )}

        <ModelViewerPane
          caseId={caseId}
          onPointSelected={
            measuring
              ? handlePointSelected
              : undefined
          }
          pointA={pointA}
          pointB={pointB}
        />
      </div>

      {/* Measurement Sidebar (hidden for read-only insurers) */}
      {!readOnly && (
      <div className="w-96 overflow-y-auto border-l border-white/10 bg-zinc-950 p-6 text-white">
        <h2 className="mb-6 text-xl font-bold">
          Measurements
        </h2>

        {/* Current measurement */}
        {pointA && pointB && distance !== null && (
          <div className="mb-6 rounded-lg border border-white/10 p-4">
            <p className="mb-3 font-semibold">
              Current measurement
            </p>

            <p className="mb-3 text-sm text-zinc-400">
              Distance:{" "}
              <span className="font-mono text-white">
                {distance.toFixed(2)} m
              </span>
            </p>

            <input
              type="text"
              value={label}
              onChange={(event) =>
                setLabel(event.target.value)
              }
              placeholder="Measurement label"
              className="mb-3 w-full rounded bg-white px-3 py-2 text-sm text-black"
            />

            <button
              onClick={saveMeasurement}
              disabled={
                saving || !label.trim()
              }
              className="w-full rounded bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Measurement"}
            </button>
          </div>
        )}

        {/* Saved measurements */}
        <div className="flex flex-col gap-3">
          {measurements.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No saved measurements yet.
            </p>
          ) : (
            measurements.map((measurement) => (
              <div
                key={measurement.id}
                className="rounded-lg border border-white/10 p-4"
              >
                <p className="text-sm font-semibold">
                  {measurement.label}
                </p>

                <div className="mt-2 flex justify-between text-xs text-zinc-400">
                  <span>Distance:</span>

                  <span className="font-mono font-medium text-white">
                    {measurement.distanceMeters.toFixed(
                      2
                    )}{" "}
                    m
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {!readOnly && (
        <button
          onClick={finishMeasuring}
          disabled={
           finishing ||
           finished ||
           measurements.length === 0
          }
          className="mt-6 w-full rounded bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {finished
            ? "Measurements Complete"
            : finishing
              ? "Finishing..."
              : "Done Measuring"}
          </button>
        )}

      </div>
      )}
    </div>
  );
}