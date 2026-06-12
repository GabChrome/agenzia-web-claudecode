'use client';

import { createRef, useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONVERGENCE_START, CONVERGENCE_SPREAD, CONVERGENCE_END } from './heroTimings';
import { DISPLAY_CENTER } from './Laptop';

// Palette estratta dai materiali della scena, pesata su oro e avorio
const PALETTE = ['#C8A040', '#C8A040', '#F2EAD8', '#F2EAD8', '#B5AEA2', '#8A6420'];

// Brevi stringhe "da codice" renderizzate su CanvasTexture (nessun font remoto)
const TEXTS = ['01', '10', '</>', '{ }', '404', '==', '#', '42'];

type Cfg = {
  start: THREE.Vector3;
  ctrl: THREE.Vector3;   // punto di controllo della Bézier → traiettoria curva
  target: THREE.Vector3; // punto d'ingresso sul display
  t0: number;            // inizio convergenza (progress globale)
  t1: number;            // fine convergenza
  phase: number;
  idleAmp: number;
  wobbleAmp: number;
  wobbleFreq: number;
  wobbleDir: THREE.Vector3;
  baseScale: number;
  rotSpeed: [number, number, number];
  color: string;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeCfg(laptopScale: number, laptopY: number): Cfg {
  // Posizione iniziale: volume attorno al laptop, con un "buco" centrale
  // dove sta il laptop stesso
  let x = 0, y = 0, z = 0;
  do {
    x = rand(-3.4, 3.4);
    y = rand(-1.6, 2.3);
    z = rand(-2.2, 1.6);
  } while (Math.abs(x) < 1.1 && y > -0.9 && y < 1.2 && z > -1.1 && z < 1.1);

  const start = new THREE.Vector3(x, y, z);
  // Punto d'ingresso: un punto casuale sul rettangolo del display
  // (DISPLAY_CENTER è in coordinate laptop: va riportato in scena)
  const target = DISPLAY_CENTER.clone().multiplyScalar(laptopScale);
  target.y += laptopY;
  target.add(new THREE.Vector3(
    rand(-1.05, 1.05) * laptopScale,
    rand(-0.5, 0.6) * laptopScale,
    0.06
  ));
  // Controllo Bézier deviato lateralmente → percorso ondulato, non rettilineo
  const ctrl = start.clone().lerp(target, 0.5)
    .add(new THREE.Vector3(rand(-1.4, 1.4), rand(-1.0, 1.2), rand(-0.6, 0.6)));

  const t0 = CONVERGENCE_START + Math.random() * CONVERGENCE_SPREAD;
  const t1 = Math.min(CONVERGENCE_END, t0 + rand(0.3, 0.48));

  return {
    start, ctrl, target, t0, t1,
    phase: rand(0, Math.PI * 2),
    idleAmp: rand(0.04, 0.12),
    wobbleAmp: rand(0.15, 0.45),
    wobbleFreq: rand(1.5, 3.5),
    wobbleDir: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-0.4, 0.4)).normalize(),
    baseScale: rand(0.6, 1.4),
    rotSpeed: [rand(-0.6, 0.6), rand(-0.6, 0.6), rand(-0.6, 0.6)],
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

const _p = new THREE.Vector3();

/** Applica a `obj` posizione/scala/rotazione dell'elemento per il progress corrente. */
function applyCfg(cfg: Cfg, progress: number, time: number, obj: THREE.Object3D) {
  const raw = Math.min(1, Math.max(0, (progress - cfg.t0) / (cfg.t1 - cfg.t0)));
  const e = easeInOut(raw);
  const inv = 1 - e;

  // Bézier quadratica start → ctrl → target
  _p.set(0, 0, 0)
    .addScaledVector(cfg.start, inv * inv)
    .addScaledVector(cfg.ctrl, 2 * inv * e)
    .addScaledVector(cfg.target, e * e);

  // Ondulazione laterale lungo il percorso, si spegne all'arrivo
  _p.addScaledVector(cfg.wobbleDir, Math.sin(e * Math.PI * cfg.wobbleFreq + cfg.phase) * cfg.wobbleAmp * inv);

  // Respiro idle (fase 1), scompare progressivamente durante la convergenza
  _p.x += Math.sin(time * 0.6 + cfg.phase) * cfg.idleAmp * inv;
  _p.y += Math.cos(time * 0.8 + cfg.phase * 1.7) * cfg.idleAmp * inv;

  obj.position.copy(_p);
  // Si rimpicciolisce solo nel tratto finale: "entra" nello schermo
  const s = cfg.baseScale * (1 - smooth(0.72, 1, e));
  obj.scale.setScalar(Math.max(0.0001, s));
  obj.rotation.set(
    cfg.phase + time * cfg.rotSpeed[0] * inv,
    cfg.phase * 0.7 + time * cfg.rotSpeed[1] * inv,
    time * cfg.rotSpeed[2] * inv
  );
}

function makeTextTexture(text: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.font = '700 72px "Plus Jakarta Sans", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);
  return new THREE.CanvasTexture(c);
}

type ShapeGroup = {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  cfgs: Cfg[];
  ref: RefObject<THREE.InstancedMesh>;
};

export default function FloatingElements({
  progressRef,
  count,
  laptopScale,
  laptopY,
}: {
  progressRef: MutableRefObject<number>;
  count: number;
  laptopScale: number;
  laptopY: number;
}) {
  const textCount = Math.min(TEXTS.length, Math.max(4, Math.round(count * 0.15)));
  const shapeCount = count - textCount;

  const groups = useMemo<ShapeGroup[]>(() => {
    // Mix di forme: cubi, anelli, tetraedri, linee sottili, piani colorati
    const kinds = [
      { geo: new THREE.BoxGeometry(0.16, 0.16, 0.16), share: 0.25, side: false },
      { geo: new THREE.TorusGeometry(0.09, 0.024, 8, 24), share: 0.2, side: false },
      { geo: new THREE.TetrahedronGeometry(0.13), share: 0.2, side: false },
      { geo: new THREE.BoxGeometry(0.55, 0.02, 0.02), share: 0.15, side: false }, // linee
      { geo: new THREE.PlaneGeometry(0.24, 0.17), share: 0.2, side: true },       // blocchetti
    ];
    return kinds.map((k) => ({
      geo: k.geo,
      mat: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        metalness: 0.35,
        roughness: 0.5,
        side: k.side ? THREE.DoubleSide : THREE.FrontSide,
      }),
      cfgs: Array.from({ length: Math.max(1, Math.round(shapeCount * k.share)) }, () =>
        makeCfg(laptopScale, laptopY)
      ),
      ref: createRef<THREE.InstancedMesh>(),
    }));
  }, [shapeCount, laptopScale, laptopY]);

  const textItems = useMemo(
    () =>
      TEXTS.slice(0, textCount).map((txt, i) => ({
        cfg: makeCfg(laptopScale, laptopY),
        tex: makeTextTexture(txt, i % 3 === 0 ? '#C8A040' : '#D8D2C6'),
      })),
    [textCount, laptopScale, laptopY]
  );
  const textRefs = useRef<Array<THREE.Mesh | null>>([]);

  // Colore per istanza
  useEffect(() => {
    const c = new THREE.Color();
    groups.forEach((g) => {
      const mesh = g.ref.current;
      if (!mesh) return;
      g.cfgs.forEach((cfg, i) => mesh.setColorAt(i, c.set(cfg.color)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [groups]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const progress = progressRef.current;
    const t = state.clock.elapsedTime;

    groups.forEach((g) => {
      const mesh = g.ref.current;
      if (!mesh) return;
      g.cfgs.forEach((cfg, i) => {
        applyCfg(cfg, progress, t, dummy);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });

    textItems.forEach((it, i) => {
      const m = textRefs.current[i];
      if (m) applyCfg(it.cfg, progress, t, m);
    });
  });

  return (
    <group>
      {groups.map((g, gi) => (
        <instancedMesh
          key={gi}
          ref={g.ref}
          args={[g.geo, g.mat, g.cfgs.length]}
          frustumCulled={false}
        />
      ))}
      {textItems.map((it, i) => (
        <mesh
          key={`txt-${i}`}
          ref={(el) => {
            textRefs.current[i] = el;
          }}
          frustumCulled={false}
        >
          <planeGeometry args={[0.5, 0.25]} />
          <meshBasicMaterial map={it.tex} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
