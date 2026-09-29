export type FingerId = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'

/** Flexão de cada dedo: 0 = estendido, 1 = totalmente fechado. */
export type FingerPose = Record<FingerId, number>

export type Finish = 'carbon' | 'titanium' | 'ceramic'

export type ViewMode = 'solid' | 'xray'

export type Theme = 'dark' | 'light' | 'glass'

export interface GripPreset {
  id: string
  label: string
  description: string
  pose: FingerPose
}

export interface SimulatorConfig {
  pose: FingerPose
  finish: Finish
  accent: string
  viewMode: ViewMode
  explode: number
  wristRotation: number
  wristFlex: number
  motorPower: number
}
