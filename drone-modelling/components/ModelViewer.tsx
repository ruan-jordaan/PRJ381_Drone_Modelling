"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds } from "@react-three/drei";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ModelViewer({ url }: { url: string }) {
  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Suspense fallback={null}>
        {/* NodeODM exports real-world-scaled meshes that can sit far from the
            origin (GPS-anchored coordinates) or span tens/hundreds of meters —
            a fixed camera position can't assume the model is anywhere near it.
            Bounds auto-fits the camera to whatever actually loaded. */}
        <Bounds fit clip observe margin={1.2}>
          <Model url={url} />
        </Bounds>
        <Environment preset="city" />
      </Suspense>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
