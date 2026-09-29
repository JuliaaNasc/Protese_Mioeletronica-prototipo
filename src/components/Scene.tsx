import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import type { FingerId, SimulatorConfig } from '../types'
import { HandModel } from './HandModel'

interface SceneProps {
  config: SimulatorConfig
  hovered: FingerId | null
  onHover: (id: FingerId | null) => void
  onToggleFinger: (id: FingerId) => void
  autoRotate: boolean
}

export function Scene({ config, hovered, onHover, onToggleFinger, autoRotate }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 10.5], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onHover(null)}
    >
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, 1, -3]} intensity={18} color={config.accent} distance={12} />

      <Suspense fallback={null}>
        <HandModel config={config} hovered={hovered} onHover={onHover} onToggleFinger={onToggleFinger} />
        {/* Ambiente gerado localmente, sem HDR externo */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[0, 5, -6]} scale={[10, 4, 1]} />
          <Lightformer form="rect" intensity={2} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[6, 1, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer form="ring" intensity={2} color={config.accent} position={[0, 3, 6]} scale={3} />
        </Environment>
      </Suspense>

      <ContactShadows position={[0, -2.75, 0]} opacity={0.45} scale={9} blur={2.6} far={4} />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={6}
        maxDistance={16}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.62}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        enableDamping
      />
    </Canvas>
  )
}
