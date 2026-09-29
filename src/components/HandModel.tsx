import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { FINISHES } from '../data/presets'
import type { FingerId, FingerPose, SimulatorConfig } from '../types'

interface Materials {
  shell: THREE.MeshPhysicalMaterial
  shellHover: THREE.MeshPhysicalMaterial
  joint: THREE.MeshStandardMaterial
  accent: THREE.MeshStandardMaterial
  tendon: THREE.MeshStandardMaterial
}

interface FingerSpec {
  id: FingerId
  base: [number, number, number]
  baseRotation: [number, number, number]
  width: number
  lengths: [number, number, number]
  /** Ângulo máximo (rad) de cada articulação quando curl = 1. */
  maxAngles: [number, number, number]
  /** Eixo de flexão em relação ao grupo local: [x, z]. */
  bend: [number, number]
}

const FINGER_SPECS: FingerSpec[] = [
  {
    id: 'thumb',
    base: [-0.78, -0.38, 0.14],
    baseRotation: [0, -0.35, 0.8],
    width: 0.37,
    lengths: [0.55, 0.42, 0.34],
    maxAngles: [0.75, 0.85, 0.95],
    bend: [0.55, -1],
  },
  {
    id: 'index',
    base: [-0.6, 0.88, 0],
    baseRotation: [0, 0, 0.06],
    width: 0.34,
    lengths: [0.62, 0.4, 0.32],
    maxAngles: [1.45, 1.6, 1.1],
    bend: [1, 0],
  },
  {
    id: 'middle',
    base: [-0.2, 0.9, 0],
    baseRotation: [0, 0, 0],
    width: 0.35,
    lengths: [0.68, 0.45, 0.34],
    maxAngles: [1.45, 1.6, 1.1],
    bend: [1, 0],
  },
  {
    id: 'ring',
    base: [0.2, 0.88, 0],
    baseRotation: [0, 0, -0.05],
    width: 0.33,
    lengths: [0.62, 0.42, 0.32],
    maxAngles: [1.45, 1.6, 1.1],
    bend: [1, 0],
  },
  {
    id: 'pinky',
    base: [0.58, 0.8, 0],
    baseRotation: [0, 0, -0.14],
    width: 0.29,
    lengths: [0.48, 0.32, 0.26],
    maxAngles: [1.45, 1.6, 1.1],
    bend: [1, 0],
  },
]

const DEPTH_RATIO = 0.95

function useMaterials(config: SimulatorConfig): Materials {
  const { finish, viewMode, accent } = config

  const materials = useMemo<Materials>(() => {
    const spec = FINISHES.find((f) => f.id === finish) ?? FINISHES[0]
    const xray = viewMode === 'xray'

    const shellParams: THREE.MeshPhysicalMaterialParameters = {
      color: spec.color,
      metalness: spec.metalness,
      roughness: spec.roughness,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
      transparent: xray,
      opacity: xray ? 0.1 : 1,
      depthWrite: !xray,
    }

    return {
      shell: new THREE.MeshPhysicalMaterial(shellParams),
      shellHover: new THREE.MeshPhysicalMaterial({
        ...shellParams,
        emissive: new THREE.Color(accent),
        emissiveIntensity: xray ? 0.6 : 0.28,
        opacity: xray ? 0.22 : 1,
      }),
      joint: new THREE.MeshStandardMaterial({
        color: '#2b3038',
        metalness: 0.9,
        roughness: 0.32,
        transparent: xray,
        opacity: xray ? 0.3 : 1,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 2,
        toneMapped: false,
      }),
      tendon: new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: xray ? 2.4 : 0.6,
        toneMapped: false,
      }),
    }
  }, [finish, viewMode, accent])

  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose())
    },
    [materials],
  )

  return materials
}

interface SegmentProps {
  width: number
  length: number
  materials: Materials
  highlighted: boolean
  tip?: boolean
}

function Segment({ width, length, materials, highlighted, tip }: SegmentProps) {
  const depth = width * DEPTH_RATIO
  return (
    <group>
      {/* Articulação (eixo do motor) */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={materials.joint} castShadow>
        <cylinderGeometry args={[width * 0.4, width * 0.4, width + 0.05, 28]} />
      </mesh>
      {/* Anel indicador da articulação */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={materials.accent}>
        <cylinderGeometry args={[width * 0.41, width * 0.41, 0.025, 28]} />
      </mesh>
      {/* Casca */}
      <RoundedBox
        args={[width, length - 0.06, depth]}
        radius={Math.min(0.1, width * 0.3)}
        smoothness={4}
        position={[0, length / 2, 0]}
        material={highlighted ? materials.shellHover : materials.shell}
        castShadow
        receiveShadow
      />
      {/* Tendão interno (visível no modo raio-x) */}
      <mesh position={[0, length / 2, 0]} material={materials.tendon}>
        <cylinderGeometry args={[0.022, 0.022, length, 8]} />
      </mesh>
      {tip && (
        /* Sensor tátil na ponta do dedo */
        <mesh position={[0, length * 0.62, depth / 2 + 0.004]} material={materials.accent}>
          <boxGeometry args={[width * 0.5, length * 0.35, 0.012]} />
        </mesh>
      )}
    </group>
  )
}

interface FingerProps {
  spec: FingerSpec
  materials: Materials
  pose: RefObject<FingerPose>
  explode: RefObject<number>
  highlighted: boolean
  onHover: (id: FingerId | null) => void
  onToggle: (id: FingerId) => void
}

function Finger({ spec, materials, pose, explode, highlighted, onHover, onToggle }: FingerProps) {
  const j0 = useRef<THREE.Group>(null)
  const j1 = useRef<THREE.Group>(null)
  const j2 = useRef<THREE.Group>(null)
  const [l0, l1, l2] = spec.lengths

  useFrame(() => {
    const curl = pose.current[spec.id]
    const gap = explode.current * 0.32
    const [bx, bz] = spec.bend
    const joints = [j0.current, j1.current, j2.current]
    joints.forEach((joint, i) => {
      if (!joint) return
      const angle = curl * spec.maxAngles[i]
      joint.rotation.x = angle * bx
      joint.rotation.z = angle * bz
    })
    if (j1.current) j1.current.position.y = l0 + gap
    if (j2.current) j2.current.position.y = l1 + gap
  })

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      onHover(spec.id)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      onHover(null)
      document.body.style.cursor = ''
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onToggle(spec.id)
    },
  }

  return (
    <group position={spec.base} rotation={spec.baseRotation} {...handlers}>
      <group ref={j0}>
        <Segment width={spec.width} length={l0} materials={materials} highlighted={highlighted} />
        <group ref={j1} position={[0, l0, 0]}>
          <Segment width={spec.width * 0.94} length={l1} materials={materials} highlighted={highlighted} />
          <group ref={j2} position={[0, l1, 0]}>
            <Segment width={spec.width * 0.88} length={l2} materials={materials} highlighted={highlighted} tip />
          </group>
        </group>
      </group>
    </group>
  )
}

interface HandModelProps {
  config: SimulatorConfig
  hovered: FingerId | null
  onHover: (id: FingerId | null) => void
  onToggleFinger: (id: FingerId) => void
}

export function HandModel({ config, hovered, onHover, onToggleFinger }: HandModelProps) {
  const materials = useMaterials(config)
  const root = useRef<THREE.Group>(null)
  const fingersGroup = useRef<THREE.Group>(null)
  const wristGroup = useRef<THREE.Group>(null)

  // Valores atuais interpolados — os props definem o alvo.
  const pose = useRef<FingerPose>({ ...config.pose })
  const explode = useRef(config.explode)

  useFrame((state, delta) => {
    // Motores mais potentes respondem mais rápido.
    const speed = 4 + config.motorPower * 10
    const p = pose.current
    for (const id of Object.keys(p) as FingerId[]) {
      p[id] = THREE.MathUtils.damp(p[id], config.pose[id], speed, delta)
    }
    explode.current = THREE.MathUtils.damp(explode.current, config.explode, 6, delta)

    if (root.current) {
      const t = state.clock.elapsedTime
      root.current.rotation.y = THREE.MathUtils.damp(
        root.current.rotation.y,
        THREE.MathUtils.degToRad(config.wristRotation),
        5,
        delta,
      )
      root.current.rotation.x = THREE.MathUtils.damp(
        root.current.rotation.x,
        THREE.MathUtils.degToRad(config.wristFlex),
        5,
        delta,
      )
      root.current.position.y = Math.sin(t * 0.9) * 0.05
    }
    if (fingersGroup.current) fingersGroup.current.position.y = explode.current * 0.45
    if (wristGroup.current) wristGroup.current.position.y = -explode.current * 0.55
  })

  return (
    <group ref={root} position={[0, 0, 0]}>
      <group position={[0, 0.2, 0]}>
        {/* Palma */}
        <RoundedBox
          args={[1.72, 1.8, 0.56]}
          radius={0.22}
          smoothness={5}
          material={materials.shell}
          castShadow
          receiveShadow
        />
        {/* Barra dos nós dos dedos */}
        <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.joint}>
          <cylinderGeometry args={[0.16, 0.16, 1.62, 32]} />
        </mesh>
        {/* Faixa de LED no dorso */}
        <mesh position={[0, 0.05, -0.285]} material={materials.accent}>
          <boxGeometry args={[0.9, 0.035, 0.01]} />
        </mesh>
        {/* Almofada de sensores na palma */}
        <RoundedBox args={[1.2, 1.1, 0.04]} radius={0.015} position={[0.08, 0.02, 0.28]} material={materials.joint} />
        <mesh position={[0.08, -0.45, 0.305]} material={materials.accent}>
          <boxGeometry args={[0.5, 0.02, 0.005]} />
        </mesh>
        {/* Tendões internos da palma */}
        {[-0.6, -0.2, 0.2, 0.58].map((x) => (
          <mesh key={x} position={[x, 0, 0]} material={materials.tendon}>
            <cylinderGeometry args={[0.02, 0.02, 1.7, 6]} />
          </mesh>
        ))}

        <group ref={fingersGroup}>
          {FINGER_SPECS.map((spec) => (
            <Finger
              key={spec.id}
              spec={spec}
              materials={materials}
              pose={pose}
              explode={explode}
              highlighted={hovered === spec.id}
              onHover={onHover}
              onToggle={onToggleFinger}
            />
          ))}
        </group>

        <group ref={wristGroup}>
          {/* Punho rotativo */}
          <mesh position={[0, -1.18, 0]} material={materials.joint} castShadow>
            <cylinderGeometry args={[0.6, 0.66, 0.5, 48]} />
          </mesh>
          <mesh position={[0, -0.98, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.accent}>
            <torusGeometry args={[0.605, 0.018, 12, 64]} />
          </mesh>
          {/* Encaixe do antebraço */}
          <mesh position={[0, -2.05, 0]} material={materials.shell} castShadow receiveShadow>
            <cylinderGeometry args={[0.7, 0.78, 1.25, 48]} />
          </mesh>
          <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.joint}>
            <torusGeometry args={[0.71, 0.04, 12, 64]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
