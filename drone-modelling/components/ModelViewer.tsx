"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds, Center } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

type ModelViewerProps = {
  caseId: string;
};

function Model({ url }: { url: string }) {
  const gltf = useGLTF(url);

  const horizontalRef = useRef<THREE.Group>(null);
  const verticalRef = useRef<THREE.Group>(null);

  const dragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });

  function handlePointerDown(
    event: React.PointerEvent
  ) {
    dragging.current = true;

    previousMouse.current = {
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  function handlePointerMove(
    event: React.PointerEvent
  ) {
    if (
      !dragging.current ||
      !horizontalRef.current ||
      !verticalRef.current
    ) {
      return;
    }

    const deltaX =
      event.clientX - previousMouse.current.x;

    const deltaY =
      event.clientY - previousMouse.current.y;

    horizontalRef.current.rotation.y +=
      deltaX * 0.01;

    verticalRef.current.rotation.x +=
      deltaY * 0.01;

    verticalRef.current.rotation.x =
      THREE.MathUtils.clamp(
        verticalRef.current.rotation.x,
        -Math.PI / 2,
        Math.PI / 2
      );

    previousMouse.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handlePointerUp(
    event: React.PointerEvent
  ) {
    dragging.current = false;

    event.currentTarget.releasePointerCapture(
      event.pointerId
    );
  }

  return (
    <group
      ref={horizontalRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <group ref={verticalRef}>
        <Center>
          <primitive object={gltf.scene} />
        </Center>
      </group>
    </group>
  );
}

export default function ModelViewer({
  caseId,
}: ModelViewerProps) {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadModelUrl() {
      try {
        const response = await fetch(
          `/api/cases/${caseId}/model`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load model."
          );
        }

        setModelUrl(data.modelUrl);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load model."
        );
      }
    }

    loadModelUrl();
  }, [caseId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!modelUrl) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading 3D model...
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [0, 2, 5] }}>
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={2}
      />

        <Bounds fit clip observe margin={1.2}>
          <Model url={modelUrl} />
        </Bounds>

      <OrbitControls
         enableRotate={false}
         enableZoom
         enablePan
      />
    </Canvas>
  );
}