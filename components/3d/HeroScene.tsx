'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { SceneFallback } from './SceneLoader';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function SceneObjects({ animate }: { animate: boolean }) {
  const rig = useRef<THREE.Group>(null);
  const ico = useRef<THREE.Mesh>(null);
  const torus = useRef<THREE.Mesh>(null);
  const octa = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!animate) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [animate]);

  useFrame((state, delta) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;

    if (ico.current) {
      ico.current.rotation.y += delta * 0.25;
      ico.current.rotation.x += delta * 0.08;
    }
    if (torus.current) {
      torus.current.rotation.x += delta * 0.2;
      torus.current.rotation.z += delta * 0.12;
    }
    if (octa.current) {
      octa.current.rotation.y -= delta * 0.3;
    }

    if (rig.current) {
      // respiro + parallasse sottile dal puntatore (max ~5°)
      const targetX = pointer.current.x * 0.35;
      const targetY = Math.sin(t * 0.4) * 0.12 - pointer.current.y * 0.2;
      rig.current.position.x = THREE.MathUtils.lerp(rig.current.position.x, targetX, 0.04);
      rig.current.position.y = THREE.MathUtils.lerp(rig.current.position.y, targetY, 0.04);
    }
  });

  return (
    <group ref={rig}>
      {/* Icosaedro oro — soggetto principale */}
      <mesh ref={ico} position={[0, 0.7, 0]}>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshStandardMaterial color="#C8A040" metalness={0.92} roughness={0.22} envMapIntensity={1.2} />
      </mesh>
      {/* Guscio wireframe, eco dell'identità precedente */}
      <mesh position={[0, 0.7, 0]} scale={1.45}>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshBasicMaterial color="#C8A040" wireframe transparent opacity={0.14} />
      </mesh>

      {/* Toro bronzo in profondità */}
      <mesh ref={torus} position={[-2.8, 1.7, -2.2]} rotation={[0.6, 0.2, 0]}>
        <torusGeometry args={[0.7, 0.22, 32, 96]} />
        <meshStandardMaterial color="#8A6420" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Ottaedro avorio */}
      <mesh ref={octa} position={[2.5, 0.3, -1.6]} rotation={[0.4, 0.2, 0]}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#F2EAD8" metalness={0.15} roughness={0.55} />
      </mesh>

      {/* Sfera lontana, profondità di campo */}
      <mesh position={[1.4, 2.5, -4.5]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#C8A040" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  const reduced = usePrefersReducedMotion();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setSupported(hasWebGL());
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!supported) return <SceneFallback />;

  const animate = !reduced;

  return (
    <Canvas
      camera={{ position: [0, 1.5, 6], fov: 45 }}
      dpr={[1, 1.5]}
      frameloop={animate ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#0E0D0B']} />
      <fog attach="fog" args={['#0E0D0B', 9, 18]} />

      <ambientLight intensity={0.25} color="#F5E8C0" />
      <directionalLight position={[4, 6, 3]} intensity={0.9} color="#FFF4D8" />
      <pointLight position={[-4, 2, -2]} intensity={0.5} color="#C8A040" />

      <Suspense fallback={null}>
        {/* Environment procedurale: nessun HDRI da rete, reflections calde sui metalli */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.0} color="#FFE3A0" position={[3, 3, 2]} scale={[8, 8, 1]} />
          <Lightformer intensity={1.2} color="#C8A040" position={[-4, 1, 2]} scale={[6, 6, 1]} />
          <Lightformer intensity={0.6} color="#FFFFFF" position={[0, -3, 2]} scale={[10, 4, 1]} />
        </Environment>
        <SceneObjects animate={animate} />
        {!isMobile && (
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.85} intensity={0.35} mipmapBlur />
          </EffectComposer>
        )}
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate={animate}
        autoRotateSpeed={0.3}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  );
}
