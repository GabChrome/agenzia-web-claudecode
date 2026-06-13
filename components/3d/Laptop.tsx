'use client';

import { useRef, useEffect, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';
import { SCREEN_ON_THRESHOLD, SCREEN_FLASH_PEAK, SCREEN_SETTLE } from './heroTimings';

// ------------------------------------------------------------
// Design reference: corpo nero profondo con edge/trim in oro
// metallico saturo (stile premium MacBook in colorazione dorata).
// La cerniera è dorata. Il bordino display è un secondo anello oro.
// ------------------------------------------------------------

export const LAPTOP_TILT = 0.12;
export const DISPLAY_CENTER = new THREE.Vector3(0, 0.39, -0.61);
export const DISPLAY_W = 3.0;
export const DISPLAY_H = 1.8;

const HINGE = new THREE.Vector3(0, -0.66, -0.52);

// Griglia tasti: 12 colonne × 4 righe
const COLS = 12, ROWS = 4;
const KEY_W = 0.175, KEY_H = 0.055, KEY_D = 0.175, KEY_GAP = 0.045;
const KEY_STEP = KEY_W + KEY_GAP;

// Materiali condivisi (oro)
const GOLD_COLOR = '#D4AF37';

function screenGlow(p: number): number {
  const OFF = 0.02;
  const PEAK = 3.0;
  const ON = 0.62;
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
    () => new THREE.MeshStandardMaterial({ color: '#0F0D0A', metalness: 0.2, roughness: 0.82 }),
    []
  );

  useEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const totalW = (COLS - 1) * KEY_STEP;
    const keyY = -0.62 + KEY_H / 2;
    const frontZ = 0.68;
    let idx = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        dummy.position.set(-totalW / 2 + c * KEY_STEP, keyY, frontZ - r * KEY_STEP);
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
      {/* ══════════════════════════════════════
          BASE — corpo nero + gold edge frame
          ══════════════════════════════════════ */}

      {/* Gold edge frame: leggermente più grande del corpo,
          visibile come rim dorato su tutti i lati */}
      <RoundedBox args={[3.60, 0.24, 2.38]} radius={0.07} position={[0, -0.72, 0.6]}>
        <meshStandardMaterial color={GOLD_COLOR} metalness={0.95} roughness={0.12} />
      </RoundedBox>

      {/* Corpo base — nero profondo, leggermente davanti via polygonOffset
          così copre le facce piane del gold frame lasciando visibili solo i bordi */}
      <RoundedBox args={[3.5, 0.16, 2.3]} radius={0.05} position={[0, -0.72, 0.6]}>
        <meshStandardMaterial
          color="#141210"
          metalness={0.65}
          roughness={0.38}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </RoundedBox>

      {/* Superficie tastiera */}
      <mesh position={[0, -0.63, 0.35]}>
        <boxGeometry args={[3.0, 0.02, 1.3]} />
        <meshStandardMaterial color="#0C0A08" metalness={0.25} roughness={0.78} />
      </mesh>

      {/* Tasti (InstancedMesh) */}
      <instancedMesh
        ref={keysRef}
        args={[keyGeo, keyMat, COLS * ROWS]}
        frustumCulled={false}
      />

      {/* Trackpad */}
      <mesh position={[0, -0.628, 1.35]}>
        <boxGeometry args={[1.1, 0.015, 0.6]} />
        <meshStandardMaterial color="#1A1612" metalness={0.45} roughness={0.48} />
      </mesh>

      {/* Cerniera dorata — elemento identitario del design */}
      <mesh position={[HINGE.x, HINGE.y, HINGE.z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 3.5, 28]} />
        <meshStandardMaterial color={GOLD_COLOR} metalness={0.92} roughness={0.14} />
      </mesh>

      {/* ══════════════════════════════════════
          LID — stessa logica: gold frame + corpo nero
          ══════════════════════════════════════ */}
      <group position={[HINGE.x, HINGE.y, HINGE.z]} rotation={[-LAPTOP_TILT, 0, 0]}>

        {/* Gold edge frame del lid */}
        <RoundedBox args={[3.62, 2.18, 0.17]} radius={0.06} position={[0, 1.05, -0.04]}>
          <meshStandardMaterial color={GOLD_COLOR} metalness={0.95} roughness={0.12} />
        </RoundedBox>

        {/* Guscio posteriore — nero profondo */}
        <RoundedBox args={[3.5, 2.15, 0.1]} radius={0.04} position={[0, 1.05, -0.04]}>
          <meshStandardMaterial
            color="#141210"
            metalness={0.68}
            roughness={0.36}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </RoundedBox>

        {/* Cornice esterna display (nero opaco) */}
        <RoundedBox args={[3.3, 1.98, 0.03]} radius={0.02} position={[0, 1.05, 0.015]}>
          <meshStandardMaterial color="#0A0806" metalness={0.45} roughness={0.55} />
        </RoundedBox>

        {/* Bordino dorato interno — rim oro attorno allo schermo */}
        <RoundedBox args={[3.12, 1.90, 0.02]} radius={0.015} position={[0, 1.05, 0.026]}>
          <meshStandardMaterial color={GOLD_COLOR} metalness={0.92} roughness={0.16} />
        </RoundedBox>

        {/* DISPLAY — da scuro a glow caldo/dorato */}
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
