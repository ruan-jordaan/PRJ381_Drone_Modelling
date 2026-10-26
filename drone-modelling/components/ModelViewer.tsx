"use client";

import { Suspense } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Environment,
  Line,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

type Point3D = [number, number, number];

function Model({
  url,
  onPointSelected,
}: {
  url: string;
  onPointSelected?: (point: Point3D) => void;
}) {
  const { scene } = useGLTF(url);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (event.delta > 5) {
      return;
    }

    if (!onPointSelected) {
      return;
    }

    event.stopPropagation();

    onPointSelected([
      event.point.x,
      event.point.y,
      event.point.z,
    ]);
  }

  return (
    <primitive
      object={scene}
      onClick={handleClick}
    />
  );
}

export default function ModelViewer({
  url,
  onPointSelected,
  pointA,
  pointB,
}: {
  url: string;
  onPointSelected?: (point: Point3D) => void;
  pointA?: Point3D | null;
  pointB?: Point3D | null;
}) {
  return (
    <Canvas
      camera={{
        position: [5, 5, 5],
        fov: 50,

        // NodeODM/OpenMVS model coordinates use Z as the vertical axis.
        // OrbitControls therefore needs Z to be treated as "up".
        up: [0, 0, 1],
      }}
     >
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[5, 5, 10]}
        intensity={1}
      />

      <Suspense fallback={null}>
        <Bounds
          fit
          clip
          margin={1.2}
        >
          <Center>
            <Model
              url={url}
              onPointSelected={onPointSelected}
            />
          </Center>
        </Bounds>

        <Environment preset="city" />
      </Suspense>
      
      {pointA && (
        <mesh position={pointA} renderOrder={999}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial
            color="red"
           depthTest={false}
          />
        </mesh>
      )}

      {pointB && (
        <mesh position={pointB} renderOrder={999}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial
            color="lime"
            depthTest={false}
          />
        </mesh>
      )}

      {pointA && pointB && (
        <Line
          points={[pointA, pointB]}
          color="yellow"
          lineWidth={2}
          depthTest={false}
          renderOrder={999}
        />
      )}

      <OrbitControls
        makeDefault

        // Slight smoothing instead of immediate/jumpy camera movement.
        enableDamping
        dampingFactor={0.08}

        // Normal viewer controls.
        enableRotate
        enablePan
        enableZoom

        // Slow the controls down a little.
        rotateSpeed={0.5}
        panSpeed={0.8}
        zoomSpeed={0.8}

        // Right-click panning follows the screen instead of
        // moving along the ground plane.
        screenSpacePanning
      />
    </Canvas>
  );
}