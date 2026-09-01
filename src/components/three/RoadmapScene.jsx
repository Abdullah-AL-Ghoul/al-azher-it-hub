import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// A winding 3D learning path with glowing station nodes — the CourseRoadmap
// backdrop. Slowly rotating; pure decoration behind the page content.
function RoadPath({ palette }) {
  const tube = useRef(null)

  // Catmull-Rom curve snaking left-right while descending — evokes progress.
  const curve = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 8; i++) {
      pts.push(
        new THREE.Vector3(
          Math.sin(i * 1.1) * 2.2,
          2.6 - i * 0.65,
          Math.cos(i * 0.9) * 0.9
        )
      )
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [])

  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.055, 12, false), [curve])
  const stations = useMemo(() => curve.getPoints(8), [curve])

  useFrame((state) => {
    if (!tube.current) return
    tube.current.rotation.y = Math.sin(performance.now() * 0.00012) * 0.18
    tube.current.position.x = state.mouse.x * 0.2
  })

  return (
    <group ref={tube} rotation={[0.1, 0, 0]}>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={palette.a}
          emissive={palette.b}
          emissiveIntensity={0.5}
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
      {stations.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.13 + (i % 2) * 0.05, 20, 20]} />
          <meshStandardMaterial
            color={i % 2 ? palette.b : palette.a}
            emissive={i % 2 ? palette.b : palette.a}
            emissiveIntensity={0.7}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function RoadmapScene({ theme = 'dark' }) {
  const palette =
    theme === 'light'
      ? { a: '#2563eb', b: '#06b6d4' }
      : { a: '#3b82f6', b: '#22d3ee' }
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.5, 6], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 4]} intensity={0.8} />
      <RoadPath palette={palette} />
    </Canvas>
  )
}
