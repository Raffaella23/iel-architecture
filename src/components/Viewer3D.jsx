import React, { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Box } from '@react-three/drei'

// Placeholder geometry shown until real GLB is loaded
function PlaceholderModel({ materialColor }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      {/* Base / floor */}
      <Box args={[3, 0.1, 2]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color={materialColor} roughness={0.8} metalness={0.1} />
      </Box>
      {/* Wall left */}
      <Box args={[0.1, 2, 2]} position={[-1.5, 0.5, 0]}>
        <meshStandardMaterial color="#e8e4dc" roughness={0.9} />
      </Box>
      {/* Wall back */}
      <Box args={[3, 2, 0.1]} position={[0, 0.5, -1]}>
        <meshStandardMaterial color="#ddd9d0" roughness={0.9} />
      </Box>
      {/* Roof hint */}
      <Box args={[3, 0.08, 2]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#2a2825" roughness={1} />
      </Box>
      {/* Window opening suggestion */}
      <Box args={[0.8, 0.9, 0.12]} position={[0.6, 0.6, -0.98]}>
        <meshStandardMaterial color="#1a2535" roughness={0.1} metalness={0.4} transparent opacity={0.7} />
      </Box>
    </group>
  )
}

// When real GLB is available, swap this in
function GLBModel({ url, materialColor }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

const MATERIALS = [
  { id: 'travertino', label: 'Travertino', color: '#d4c4a8' },
  { id: 'rovere',    label: 'Rovere',     color: '#8b6f47' },
  { id: 'cemento',   label: 'Cemento',    color: '#9a9590' },
]

export default function Viewer3D({ glbUrl = null }) {
  const [activeMaterial, setActiveMaterial] = useState(MATERIALS[0])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [4, 3, 5], fov: 45 }}
        style={{ background: '#0f0f0f' }}
        shadows
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-3, 2, -3]} intensity={0.3} color="#c8a96e" />

        <Suspense fallback={null}>
          {glbUrl
            ? <GLBModel url={glbUrl} materialColor={activeMaterial.color} />
            : <PlaceholderModel materialColor={activeMaterial.color} />
          }
          <Environment preset="apartment" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>

      {/* Material selector overlay */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #2a2a2a',
        borderRadius: '40px',
        padding: '6px 10px',
      }}>
        {MATERIALS.map(mat => (
          <button
            key={mat.id}
            onClick={() => setActiveMaterial(mat)}
            title={mat.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: activeMaterial.id === mat.id ? 'rgba(200,169,110,0.2)' : 'transparent',
              border: activeMaterial.id === mat.id ? '1px solid #c8a96e' : '1px solid transparent',
              color: activeMaterial.id === mat.id ? '#c8a96e' : '#7a7570',
              fontSize: '11px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: mat.color,
              flexShrink: 0,
            }} />
            {mat.label}
          </button>
        ))}
      </div>

      {/* Drag hint — shown briefly */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#7a7570',
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        Trascina per esplorare
      </div>
    </div>
  )
}
