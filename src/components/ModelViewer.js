import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

/**
 * PLACEHOLDER — sostituisci con il tuo modello GLB:
 *
 *   1. Metti il file nella cartella /public/model.glb
 *   2. Decommentare le righe GLB e commentare PlaceholderVilla
 *
 * Il placeholder simula una villa semplificata con volumi architettonici.
 */

const MATERIAL_COLORS = {
  travertino: '#D4C5A9',
  cemento:    '#9B9B9B',
  rovere:     '#8B6914',
};

// ── Placeholder geometrico che imita volumi architettonici ──────────────────
function PlaceholderVilla({ color }) {
  const group = useRef();

  useFrame((state) => {
    // leggero respiro — molto sottile
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.04;
  });

  return (
    <group ref={group} position={[0, -1.5, 0]}>
      {/* Corpo principale */}
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[3.2, 1.5, 2.0]} />
        <meshStandardMaterial color="#E8E0D5" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Piano superiore arretrato */}
      <mesh castShadow receiveShadow position={[0.3, 1.95, 0.1]}>
        <boxGeometry args={[2.4, 0.9, 1.6]} />
        <meshStandardMaterial color="#DEDAD4" roughness={0.75} metalness={0.0} />
      </mesh>

      {/* Copertura piatta */}
      <mesh receiveShadow position={[0.3, 2.45, 0.1]}>
        <boxGeometry args={[2.5, 0.08, 1.7]} />
        <meshStandardMaterial color="#C8C2B8" roughness={0.9} />
      </mesh>

      {/* Pavimento / suolo — materiale selezionabile */}
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Apertura finestra grande */}
      <mesh position={[1.61, 0.75, 0.4]}>
        <boxGeometry args={[0.05, 0.9, 0.7]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.1} metalness={0.3} transparent opacity={0.7} />
      </mesh>

      {/* Porta ingresso */}
      <mesh position={[0, 0.55, 1.02]}>
        <boxGeometry args={[0.7, 1.1, 0.06]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.15} metalness={0.2} transparent opacity={0.8} />
      </mesh>

      {/* Elemento parete verticale decorativo */}
      <mesh castShadow position={[-1.8, 0.9, 0]}>
        <boxGeometry args={[0.12, 1.8, 2.1]} />
        <meshStandardMaterial color="#D0C8BC" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Componente principale ───────────────────────────────────────────────────
export default function ModelViewer({ activeMaterial }) {
  const color = MATERIAL_COLORS[activeMaterial.id] || '#D4C5A9';

  /* --- Quando hai il GLB, sostituisci con questo: ---
  const { scene } = useGLTF('/model.glb');
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.name.includes('pavimento')) {
        child.material.color.set(color);
      }
    });
  }, [color, scene]);
  return <primitive object={scene} />;
  --------------------------------------------------- */

  return <PlaceholderVilla color={color} />;
}
