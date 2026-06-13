'use client';

import { useRef, useEffect, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';
import { SCREEN_ON_THRESHOLD, SCREEN_FLASH_PEAK, SCREEN_SETTLE } from './heroTimings';

// ------------------------------------------------------------
// Laptop modellato con geometrie semplici.
// ------------------------------------------------------------

/** Inclinazione all'indietro del display (radianti). */
export const LAPTOP_TILT = 0.12;
/** Centro del display nello spazio locale del laptop: target degli elementi fluttuanti e ancora di SiteReveal. */
export const DISPLAY_CENTER = new THREE.Vector3(0, 0.39, -0.61);
export const DISPLAY_W = 3.0;
export const DISPLAY_H = 1.8;

const HINGE = new THREE.Vector3(0, -0.66, -0.52);

// Griglia tasti: 12 colonne × 4 righe
const COLS = 12, ROWS = 4;
const KEY_W = 0.175, KEY_H = 0.055, KEY_D = 0.175, KEY_GAP = 0.045;
const KEY_STEP = KEY_W + KEY_GAP; // 0.22

/**
 * Intensità emissiva del display in funzione del progress:
 * bianco spento → rampa flash → assestamento sul glow di regime.
 */
function screenGlow(p: number): number {
  const OFF = 0.02;   // schermo praticamente spento (scuro, come nei reference)
  const PEAK = 3.0;   // picco del flash dorato (ben sopra la soglia bloom)
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
  const keysRef = useRef<THREE.InstancedMesh>(null);

  const keyGeo = useMemo(() => new RoundedBoxGeometry(KEY_W, KEY_H, KEY_D, 2, 0.016), []);
  const keyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#22201C', metalness: 0.25, roughness: 0.72 }),
    []
  );

  // Posiziona i tasti sulla tastiera (una tantum, non cambiano)
  useEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const totalW = (COLS - 1) * KEY_STEP;
    const keyY = -0.62 + KEY_H / 2; // sopra la superficie della tastiera
    const frontZ = 0.68;            // riga frontale (verso trackpad)
    let idx = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        dummy.position.set(
          -totalW / 2 + c * KEY_STEP,
          keyY,
          frontZ - r * KEY_STEP,
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(idx++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

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

      {/* Superficie tastiera */}
      <mesh position={[0, -0.63, 0.35]}>
        <boxGeometry args={[3.0, 0.02, 1.3]} />
        <meshStandardMaterial color="#1C1A16" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Tasti della tastiera (instanced) */}
      <instancedMesh
        ref={keysRef}
        args={[keyGeo, keyMat, COLS * ROWS]}
        frustumCulled={false}
      />

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

        {/* Cornice esterna del display */}
        <RoundedBox args={[3.3, 1.98, 0.03]} radius={0.02} position={[0, 1.05, 0.015]}>
          <meshStandardMaterial color="#15130F" metalness={0.5} roughness={0.5} />
        </RoundedBox>

        {/* Bordino metallico interno — la linea brillante attorno allo schermo */}
        <RoundedBox args={[3.12, 1.90, 0.02]} radius={0.015} position={[0, 1.05, 0.026]}>
          <meshStandardMaterial color="#2E2A24" metalness={0.85} roughness={0.18} />
        </RoundedBox>

        {/* DISPLAY — la mesh che si accende (coordinate mondo ≈ DISPLAY_CENTER).
            Da spento è scuro con un riflesso vetroso; si accende di luce
            calda dorata (emissive warm) come nei frame di riferimento. */}
        <mesh position={[0, 1.05, 0.04]}>
          <planeGeometry args={[DISPLAY_W, DISPLAY_H]} />
          <meshStandardMaterial
            ref={displayMat}
            color="#0C0A06"
            emissive="#FFE0A0"
            emissiveIntensity={0.02}
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}
