import type { Finish, FingerId, GripPreset } from '../types'

export const FINGERS: { id: FingerId; label: string }[] = [
  { id: 'thumb', label: 'Polegar' },
  { id: 'index', label: 'Indicador' },
  { id: 'middle', label: 'Médio' },
  { id: 'ring', label: 'Anelar' },
  { id: 'pinky', label: 'Mínimo' },
]

export const GRIP_PRESETS: GripPreset[] = [
  {
    id: 'open',
    label: 'Aberta',
    description: 'Posição neutra de repouso',
    pose: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 },
  },
  {
    id: 'power',
    label: 'Força',
    description: 'Preensão cilíndrica total',
    pose: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 1 },
  },
  {
    id: 'pinch',
    label: 'Pinça',
    description: 'Polegar + indicador de precisão',
    pose: { thumb: 0.7, index: 0.62, middle: 0.1, ring: 0.05, pinky: 0 },
  },
  {
    id: 'tripod',
    label: 'Tripé',
    description: 'Segurar caneta ou talheres',
    pose: { thumb: 0.7, index: 0.55, middle: 0.55, ring: 0.2, pinky: 0.15 },
  },
  {
    id: 'point',
    label: 'Apontar',
    description: 'Teclado e telas touch',
    pose: { thumb: 0.8, index: 0, middle: 1, ring: 1, pinky: 1 },
  },
  {
    id: 'key',
    label: 'Chave',
    description: 'Preensão lateral de cartões',
    pose: { thumb: 0.45, index: 0.85, middle: 0.95, ring: 1, pinky: 1 },
  },
  {
    id: 'peace',
    label: 'Paz',
    description: 'Gesto de demonstração',
    pose: { thumb: 0.85, index: 0, middle: 0, ring: 1, pinky: 1 },
  },
]

export const FINISHES: {
  id: Finish
  label: string
  swatch: string
  color: string
  metalness: number
  roughness: number
}[] = [
  { id: 'carbon', label: 'Carbono', swatch: '#1c1f24', color: '#1c1f24', metalness: 0.35, roughness: 0.38 },
  { id: 'titanium', label: 'Titânio', swatch: '#a3abb4', color: '#a3abb4', metalness: 1, roughness: 0.28 },
  { id: 'ceramic', label: 'Cerâmica', swatch: '#ecebe6', color: '#ecebe6', metalness: 0, roughness: 0.22 },
]

export const ACCENTS = ['#b794ff', '#8b5cf6', '#d946ef', '#c4b5fd', '#6d28d9']

/** Força máxima por dedo em newtons, usada na telemetria simulada. */
export const FINGER_FORCE: Record<FingerId, number> = {
  thumb: 28,
  index: 18,
  middle: 20,
  ring: 14,
  pinky: 10,
}
