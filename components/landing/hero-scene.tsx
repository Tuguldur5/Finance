"use client";

import { Float } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as React from "react";
import * as THREE from "three";

const ACCENT = "#3b82f6";
const COIN_RADIUS = 1.3;
const COIN_HEIGHT = 0.2;
const COIN_GAP = 0.32;
const MAX_TILT = THREE.MathUtils.degToRad(8);

type HeroSceneProps = {
  /** When false the render loop stops (hero off-screen or tab hidden). */
  active: boolean;
};

/**
 * Canvas texture with the tugrik sign. A texture avoids loading a 3D typeface
 * just for one glyph, so the scene has no extra network dependency.
 */
function useCoinMarkTexture() {
  const texture = React.useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#8a8a8a";
    context.font = "600 300px Arial, Helvetica, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("₮", canvas.width / 2, canvas.height / 2 + 8);

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, []);

  React.useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}

function CoinMark() {
  const markTexture = useCoinMarkTexture();

  if (!markTexture) return null;

  return (
    <mesh
      position={[0, COIN_HEIGHT / 2 + 0.002, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1}
    >
      <planeGeometry args={[COIN_RADIUS * 1.45, COIN_RADIUS * 1.45]} />
      <meshBasicMaterial
        map={markTexture}
        transparent
        opacity={0.85}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Coin({
  showMark = false,
  light = false,
}: {
  showMark?: boolean;
  light?: boolean;
}) {
  const rimColor = light ? "#2563eb" : ACCENT;

  return (
    <group>
      <mesh>
        <cylinderGeometry
          args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 64]}
        />
        <meshStandardMaterial
          color={light ? "#1a1a1a" : "#111111"}
          metalness={0.9}
          roughness={0.35}
        />
      </mesh>

      {[COIN_HEIGHT / 2, -COIN_HEIGHT / 2].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[COIN_RADIUS, 0.012, 8, 64]} />
          <meshStandardMaterial
            color={rimColor}
            emissive={rimColor}
            emissiveIntensity={light ? 0.9 : 1.4}
            metalness={0.5}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}

      {showMark ? <CoinMark /> : null}
    </group>
  );
}

function CoinStack({
  coinCount,
  light = false,
}: {
  coinCount: number;
  light?: boolean;
}) {
  const group = React.useRef<THREE.Group>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((_, delta) => {
    const current = group.current;
    if (!current) return;

    current.rotation.y += delta * 0.15;
    current.rotation.x = THREE.MathUtils.lerp(
      current.rotation.x,
      -pointer.y * MAX_TILT,
      0.05,
    );
    current.rotation.z = THREE.MathUtils.lerp(
      current.rotation.z,
      -pointer.x * MAX_TILT,
      0.05,
    );
  });

  return (
    <group ref={group}>
      {Array.from({ length: coinCount }).map((_, index) => {
        const y = (index - (coinCount - 1) / 2) * COIN_GAP;

        return (
          <group key={index} position={[0, y, 0]}>
            <Coin showMark={index === coinCount - 1} light={light} />
          </group>
        );
      })}
    </group>
  );
}

function FloatingOrnaments({ count }: { count: number }) {
  const group = React.useRef<THREE.Group>(null);

  const ornaments = React.useMemo(() => {
    return Array.from({ length: count }).map((_, index) => {
      const angle = (index / Math.max(count, 1)) * Math.PI * 2;

      return {
        position: [
          Math.cos(angle) * (2.05 + (index % 3) * 0.3),
          Math.sin(angle * 1.7) * 1.45,
          -1.1 - (index % 4) * 0.35,
        ] as [number, number, number],
        rotation: [angle, angle * 0.6, 0] as [number, number, number],
        radius: 0.16 + (index % 3) * 0.06,
        isRing: index % 2 === 0,
      };
    });
  }, [count]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y -= delta * 0.045;
    }
  });

  return (
    <group ref={group}>
      {ornaments.map((ornament, index) => (
        <mesh
          key={index}
          position={ornament.position}
          rotation={ornament.rotation}
        >
          {ornament.isRing ? (
            <torusGeometry args={[ornament.radius, 0.007, 6, 40]} />
          ) : (
            <sphereGeometry args={[0.035 + (index % 3) * 0.012, 12, 12]} />
          )}
          <meshBasicMaterial
            color={ornament.isRing ? "#93c5fd" : ACCENT}
            transparent
            opacity={ornament.isRing ? 0.28 : 0.45}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroScene({ active }: HeroSceneProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const light = mounted && resolvedTheme === "light";

  const quality = React.useMemo(() => {
    const lowEnd =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4);

    return {
      dpr: (lowEnd ? 1 : [1, 1.5]) as number | [number, number],
      coinCount: lowEnd ? 1 : 3,
      ornamentCount: lowEnd ? 3 : 7,
    };
  }, []);

  return (
    <Canvas
      dpr={quality.dpr}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 1.4, 6], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 0, 0);
        gl.setClearColor(0x000000, 0);
      }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={light ? 1.05 : 0.55} />
      <directionalLight position={[4, 6, 4]} intensity={light ? 1.3 : 1.6} />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={light ? 0.5 : 0.35}
        color="#93c5fd"
      />
      <pointLight
        position={[2.5, 1.8, -3]}
        intensity={light ? 12 : 22}
        distance={14}
        decay={2}
        color={light ? "#2563eb" : ACCENT}
      />

      <Float
        speed={1.3}
        rotationIntensity={0.15}
        floatIntensity={0.5}
        floatingRange={[-0.06, 0.06]}
      >
        <CoinStack coinCount={quality.coinCount} light={light} />
      </Float>

      <FloatingOrnaments count={quality.ornamentCount} />
    </Canvas>
  );
}
