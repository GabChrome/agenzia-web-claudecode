'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

import * as THREE from 'three';

function WireframeTorus() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.15;
    meshRef.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1.4, 0.45, 16, 60]} />
      <meshBasicMaterial
        color="#6C63FF"
        wireframe
        transparent
        opacity={0.55}
      />
    </mesh>
  );
}

function OuterRing() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x -= delta * 0.08;
    meshRef.current.rotation.z += delta * 0.12;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[2.1, 0.015, 8, 100]} />
      <meshBasicMaterial color="#857DFF" transparent opacity={0.3} />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <div className="w-full h-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <WireframeTorus />
        <OuterRing />
      </Canvas>
    </div>
  );
}
