import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// Star/particle field that drifts upward slowly and reacts to the mouse.
// Geometry is generated once; per-frame work is a single buffer update.
function StarField({ color, count = 700 }) {
  const points = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (!points.current) return
    const pos = points.current.geometry.attributes.position
    const arr = pos.array
    // Slow upward drift with wrap-around.
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * 0.22
      if (arr[i * 3 + 1] > 4.5) arr[i * 3 + 1] = -4.5
    }
    pos.needsUpdate = true
    // Soft parallax toward the pointer.
    mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, state.mouse.x * 0.5, 0.04)
    mouse.current.y = THREE.MathUtils.lerp(mouse.current.y, -state.mouse.y * 0.35, 0.04)
    points.current.position.x = mouse.current.x
    points.current.position.y = mouse.current.y
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={color}
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function ParticlesScene({ theme = 'dark', paused = false }) {
  const color = theme === 'light' ? '#2563eb' : '#67e8f9'
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 55 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      frameloop={paused ? 'never' : 'always'}
      style={{ width: '100%', height: '100%' }}
    >
      <StarField color={color} />
    </Canvas>
  )
}
