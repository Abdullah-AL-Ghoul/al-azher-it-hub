import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// Swarm of glowing cubes tumbling in space — the 404 "lost data" metaphor.
// Mouse moves the whole swarm subtly; individual cubes rotate freely.
function CubeSwarm({ palette, count = 26 }) {
  const group = useRef(null)
  const cubes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        pos: [
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 4.5,
          (Math.random() - 0.5) * 4,
        ],
        scale: 0.14 + Math.random() * 0.3,
        speed: 0.3 + Math.random() * 1.1,
        axis: [Math.random(), Math.random(), Math.random()].map((v) => v * 0.02),
        color: [palette.a, palette.b, palette.c][i % 3],
      })),
    [count, palette]
  )

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      state.mouse.x * 0.4,
      0.04
    )
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -state.mouse.y * 0.3,
      0.04
    )
  })

  return (
    <group ref={group}>
      {cubes.map((c, i) => (
        <TumblingCube key={i} {...c} />
      ))}
    </group>
  )
}

function TumblingCube({ pos, scale, speed, axis, color }) {
  const mesh = useRef(null)
  useFrame((_, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.x += axis[0] * speed * delta * 60
    mesh.current.rotation.y += axis[1] * speed * delta * 60
    mesh.current.position.y += Math.sin(performance.now() * 0.001 * speed) * 0.0015
  })
  return (
    <mesh ref={mesh} position={pos} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        metalness={0.45}
        roughness={0.3}
      />
    </mesh>
  )
}

export default function CubesScene({ theme = 'dark' }) {
  const palette =
    theme === 'light'
      ? { a: '#2563eb', b: '#06b6d4', c: '#8b5cf6' }
      : { a: '#3b82f6', b: '#22d3ee', c: '#a78bfa' }
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} />
      <CubeSwarm palette={palette} />
    </Canvas>
  )
}
