import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

// Brand palette reacts to the active theme (dark/amoled glow brighter).
const PALETTES = {
  light: { a: '#2563eb', b: '#06b6d4', c: '#8b5cf6', glow: 0.55 },
  dark: { a: '#3b82f6', b: '#22d3ee', c: '#a78bfa', glow: 0.85 },
}

function KnowledgeCluster({ palette }) {
  const group = useRef(null)
  useFrame((state) => {
    if (!group.current) return
    // Gentle whole-cluster sway + subtle mouse parallax.
    const { mouse } = state
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      mouse.x * 0.35 + performance.now() * 0.00008,
      0.05
    )
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -mouse.y * 0.25,
      0.05
    )
  })

  return (
    <group ref={group}>
      {/* Core icosahedron — the "knowledge nucleus" */}
      <Float speed={1.4} rotationIntensity={0.6} floatIntensity={0.9}>
        <mesh>
          <icosahedronGeometry args={[1.15, 1]} />
          <MeshDistortMaterial
            color={palette.a}
            emissive={palette.a}
            emissiveIntensity={palette.glow * 0.35}
            metalness={0.35}
            roughness={0.22}
            distort={0.22}
            speed={1.6}
          />
        </mesh>
      </Float>

      {/* Orbiting glass shells */}
      <Float speed={1.1} rotationIntensity={0.9} floatIntensity={0.5}>
        <mesh position={[1.9, 0.55, -0.6]}>
          <torusGeometry args={[0.5, 0.045, 24, 72]} />
          <meshStandardMaterial color={palette.b} emissive={palette.b} emissiveIntensity={palette.glow * 0.5} metalness={0.6} roughness={0.25} />
        </mesh>
      </Float>
      <Float speed={1.7} rotationIntensity={0.7} floatIntensity={0.7}>
        <mesh position={[-1.85, -0.5, 0.4]} rotation={[Math.PI / 3, 0.4, 0]}>
          <torusGeometry args={[0.38, 0.04, 24, 72]} />
          <meshStandardMaterial color={palette.c} emissive={palette.c} emissiveIntensity={palette.glow * 0.5} metalness={0.6} roughness={0.25} />
        </mesh>
      </Float>

      {/* Satellite cubes */}
      <Float speed={2.1} rotationIntensity={1.2} floatIntensity={1.1}>
        <mesh position={[-1.35, 1.15, 0.9]} rotation={[0.5, 0.7, 0.2]}>
          <boxGeometry args={[0.34, 0.34, 0.34]} />
          <meshStandardMaterial color={palette.b} emissive={palette.b} emissiveIntensity={palette.glow * 0.4} metalness={0.5} roughness={0.3} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={1} floatIntensity={0.9}>
        <mesh position={[1.25, -1.2, 0.8]} rotation={[-0.4, 0.2, 0.6]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color={palette.a} emissive={palette.a} emissiveIntensity={palette.glow * 0.45} metalness={0.5} roughness={0.3} />
        </mesh>
      </Float>

      {/* Ambient sparkle dust */}
      <Sparkles count={60} scale={[6, 4.5, 3]} size={2.2} speed={0.35} color={palette.b} opacity={0.55} />
    </group>
  )
}

export default function KnowledgeScene({ theme = 'dark' }) {
  const palette = PALETTES[theme === 'light' ? 'light' : 'dark']
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} />
      <pointLight position={[-4, -3, 2]} intensity={0.5} color={palette.b} />
      <KnowledgeCluster palette={palette} />
    </Canvas>
  )
}
