import { useEffect, useRef } from 'react'
import { FINGER_FORCE, FINGERS } from '../data/presets'
import type { FingerPose } from '../types'

interface EmgProps {
  activity: number
  color: string
}

/** Sinal EMG simulado: ruído modulado pela atividade muscular. */
function EmgSignal({ activity, color }: EmgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activityRef = useRef(activity)
  activityRef.current = activity

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const samples: number[] = []
    let raf = 0
    let smoothed = activityRef.current

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      smoothed += (activityRef.current - smoothed) * 0.08
      const count = Math.floor(w / 2)
      for (let i = 0; i < 3; i++) {
        const burst = (Math.random() * 2 - 1) * (0.06 + smoothed * 0.9)
        samples.push(burst)
      }
      while (samples.length > count) samples.shift()

      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.25
      ctx.shadowColor = color
      ctx.shadowBlur = 6
      ctx.beginPath()
      samples.forEach((s, i) => {
        const x = w - (samples.length - i) * 2
        const y = h / 2 + s * (h / 2 - 2)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      if (!reduced) raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [color])

  return <canvas ref={canvasRef} className="h-12 w-full" aria-hidden />
}

interface TelemetryProps {
  pose: FingerPose
  motorPower: number
  accent: string
}

export function Telemetry({ pose, motorPower, accent }: TelemetryProps) {
  const forces = FINGERS.map((f) => ({
    ...f,
    force: pose[f.id] * FINGER_FORCE[f.id] * motorPower,
  }))
  const total = forces.reduce((sum, f) => sum + f.force, 0)
  const activity = FINGERS.reduce((sum, f) => sum + pose[f.id], 0) / FINGERS.length
  const draw = 1.2 + activity * 6.5 * motorPower
  const latency = Math.round(42 - motorPower * 18)

  return (
    <div className="panel rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
          <span className="pulse-dot size-1.5 rounded-full bg-accent" />
          Sinal mioelétrico
        </span>
        <span className="font-mono text-[11px] text-muted">CH1 · 1 kHz</span>
      </div>
      <EmgSignal activity={activity} color={accent} />

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
        <Stat label="Força total" value={total.toFixed(1)} unit="N" />
        <Stat label="Consumo" value={draw.toFixed(1)} unit="W" />
        <Stat label="Latência" value={String(latency)} unit="ms" />
      </div>

      <div className="mt-3 flex h-10 items-end gap-1.5">
        {forces.map((f) => (
          <div key={f.id} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative h-7 w-full overflow-hidden rounded-sm bg-surface-2">
              <div
                className="absolute inset-x-0 bottom-0 bg-accent transition-[height] duration-300"
                style={{ height: `${(f.force / FINGER_FORCE[f.id]) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-muted uppercase">{f.label.slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted">{label}</div>
      <div className="font-mono text-lg text-ink tabular-nums">
        {value}
        <span className="ml-0.5 text-xs text-muted">{unit}</span>
      </div>
    </div>
  )
}
