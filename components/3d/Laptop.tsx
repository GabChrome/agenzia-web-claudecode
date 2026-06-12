'use client';

import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { SCREEN_ON_THRESHOLD, SCREEN_FLASH_PEAK, SCREEN_SETTLE } from './heroTimings';

// ------------------------------------------------------------
// Laptop modellato con geometrie semplici.
// Per usare un modello .glb low-poly al suo posto:
//   const { scene } = useGLTF('/models/laptop.glb')  ← path del modello qui
// e sostituisci base + lid con <primitive object={scene} />,
// mantenendo però la mesh "display" separata qui sotto: è quella
// il cui materiale viene acceso e su cui si compone il sito.
// ------------------------------------------------------------

/** Inclinazione all'indietro del display (radianti). */
export const LAPTOP_TILT = 0.12;
/** Centro del display nello spazio mondo: target degli elementi fluttuanti e ancora di SiteReveal. */
export const DISPLAY_CENTER = new THREE.Vector3(0, 0.39, -0.61);
export const DISPLAY_W = 3.0;
export const DISPLAY_H = 1.8;

// Posizione della cerniera: il gruppo lid/display ruota da qui.
const HINGE = new THREE.Vector3(0, -0.66, -0.52);

/**
 * Intensità emissiva del display in funzione del progress:
 * bianco spento → rampa flash → assestamento sul glow di regime.
 */
function screenGlow(p: number): number {
  const OFF = 0.12;   // display bianco "spento"
  const PEAK = 2.6;   // picco del flash (sopra la soglia bloom)
  const ON = 0.62;    // glow di regime con il sito visibile
  if (p < SCREEN_ON_THRESHOLD) return OFF;
  if (p < SCREEN_FLASH_PEAK) {
    const k = (p - SCREEN_ON_THRESHOLD) / (SCREEN_FLASH_PEAK - SCREEN_ON_THRESHOLD);
    return OFF + k * (PEAK - OFF);
  }
  const k = Math.min(1, (p - SCREEN_FLASH_PEAK) / (SCREEN_SETTLE - SCREEN_FLASH_PEAK));
  return PEAK + k * (ON - PEAK);
}

export default function Laptop({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const displayMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (displayMat.current) {
      displayMat.current.emissiveIntensity = screenGlow(progressRef.current);
    }
  });

  return (
    <group>
      {/* Base */}
      <RoundedBox args={[3.5, 0.16, 2.3]} radius={0.05} position={[0, -0.72, 0.6]}>
        <meshStandardMaterial color="#2A2722" metalness={0.7} roughness={0.4} />
      </RoundedBox>
      {/* Tastiera */}
      <mesh position={[0, -0.63, 0.35]}>
        <boxGeometry args={[3.0, 0.02, 1.3]} />
        <meshStandardMaterial color="#1C1A16" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Trackpad */}
      <mesh position={[0, -0.628, 1.35]}>
        <boxGeometry args={[1.1, 0.015, 0.6]} />
        <meshStandardMaterial color="#211E19" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Cerniera */}
      <mesh position={[HINGE.x, HINGE.y, HINGE.z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 3.3, 24]} />
        <meshStandardMaterial color="#211E19" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Lid + display, incernierati e inclinati all'indietro */}
      <group position={[HINGE.x, HINGE.y, HINGE.z]} rotation={[-LAPTOP_TILT, 0, 0]}>
        {/* Guscio posteriore */}
        <RoundedBox args={[3.5, 2.15, 0.1]} radius={0.04} position={[0, 1.05, -0.04]}>
          <meshStandardMaterial color="#2A2722" metalness={0.7} roughness={0.4} />
        </RoundedBox>
        {/* Cornice del display */}
        <mesh position={[0, 1.05, 0.02]}>
          <boxGeometry args={[3.3, 1.98, 0.02]} />
          <meshStandardMaterial color="#15130F" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* DISPLAY — la mesh che si accende (coordinate mondo ≈ DISPLAY_CENTER) */}
        <mesh position={[0, 1.05, 0.04]}>
          <planeGeometry args={[DISPLAY_W, DISPLAY_H]} />
          <meshStandardMaterial
            ref={displayMat}
            color="#F7F4ED"
            emissive="#FFFFFF"
            emissiveIntensity={0.12}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  );
}
