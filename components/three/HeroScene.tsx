'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'

function Icosahedron() {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += 0.004
    groupRef.current.rotation.x += 0.001
    // respiro leggero con il tempo
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03
    groupRef.current.scale.setScalar(s)
  })

  return (
    <group ref={groupRef}>
      {/* Sfera wireframe principale */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial
          color="#9A7830"
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Sfera interna più piccola, ruota al contrario */}
      <mesh rotation={[0.5, 0, 0.3]}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshBasicMaterial
          color="#9A7830"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>
    </group>
  )
}

export default function HeroScene() {
  return (
    <div
      className="hero-canvas"
      style={{
        width: '100%',
        maxWidth: 520,
        aspectRatio: '1',
        position: 'relative',
      }}
    >
      {/* Glow sotto la sfera */}
      <div style={{
        position: 'absolute',
        inset: '20%',
        background: 'radial-gradient(circle, rgba(154,120,48,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: 0,
      }} />
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <ambientLight color="#C8A040" intensity={0.4} />
        <pointLight position={[2, 2, 2]} color="#F5E8C0" intensity={0.5} />
        <Suspense fallback={null}>
          <Icosahedron />
        </Suspense>
      </Canvas>
    </div>
  )
}
