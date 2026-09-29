import type { CSSProperties, ReactNode } from 'react'
import { ACCENTS, FINGERS, FINISHES, GRIP_PRESETS } from '../data/presets'
import type { FingerId, SimulatorConfig } from '../types'

interface ControlPanelProps {
  config: SimulatorConfig
  activePreset: string | null
  hovered: FingerId | null
  demo: boolean
  onChange: (patch: Partial<SimulatorConfig>) => void
  onFinger: (id: FingerId, value: number) => void
  onPreset: (id: string) => void
  onDemo: (on: boolean) => void
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  highlight?: boolean
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step = 0.01, unit = '', highlight, onChange }: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100
  const display = unit === '%' ? Math.round(value * 100) : Math.round(value)
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className={highlight ? 'text-accent' : 'text-ink'}>{label}</span>
        <span className="font-mono text-xs text-muted tabular-nums">
          {display}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function ControlPanel({
  config,
  activePreset,
  hovered,
  demo,
  onChange,
  onFinger,
  onPreset,
  onDemo,
}: ControlPanelProps) {
  return (
    <div className="panel flex flex-col overflow-hidden rounded-2xl">
      <Section
        title="Padrões de preensão"
        aside={
          <button
            type="button"
            onClick={() => onDemo(!demo)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase transition ${
              demo ? 'border-accent text-accent' : 'border-line text-muted hover:text-ink'
            }`}
          >
            <span className={`size-1.5 rounded-full ${demo ? 'pulse-dot bg-accent' : 'bg-muted'}`} />
            Demo
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {GRIP_PRESETS.map((preset, i) => {
            const active = activePreset === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.description}
                onClick={() => onPreset(preset.id)}
                className={`group rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line bg-surface-2 hover:border-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{preset.label}</span>
                  <kbd className={`font-mono text-[10px] ${active ? 'opacity-70' : 'text-muted'}`}>{i + 1}</kbd>
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Flexão dos dedos">
        <div className="space-y-3.5">
          {FINGERS.map((f) => (
            <Slider
              key={f.id}
              label={f.label}
              value={config.pose[f.id]}
              min={0}
              max={1}
              unit="%"
              highlight={hovered === f.id}
              onChange={(v) => onFinger(f.id, v)}
            />
          ))}
        </div>
      </Section>

      <Section title="Punho e atuadores">
        <div className="space-y-3.5">
          <Slider
            label="Rotação (pronação)"
            value={config.wristRotation}
            min={-90}
            max={90}
            step={1}
            unit="°"
            onChange={(v) => onChange({ wristRotation: v })}
          />
          <Slider
            label="Flexão do punho"
            value={config.wristFlex}
            min={-35}
            max={35}
            step={1}
            unit="°"
            onChange={(v) => onChange({ wristFlex: v })}
          />
          <Slider
            label="Potência do motor"
            value={config.motorPower}
            min={0.1}
            max={1}
            unit="%"
            onChange={(v) => onChange({ motorPower: v })}
          />
        </div>
      </Section>

      <Section title="Acabamento">
        <div className="grid grid-cols-3 gap-2">
          {FINISHES.map((f) => {
            const active = config.finish === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ finish: f.id })}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs transition ${
                  active ? 'border-accent text-ink' : 'border-line text-muted hover:text-ink'
                }`}
              >
                <span
                  className="size-7 rounded-full border border-line shadow-inner"
                  style={{
                    background:
                      f.id === 'titanium'
                        ? `linear-gradient(135deg, #e3e7ea, ${f.swatch} 55%, #6b737c)`
                        : f.id === 'carbon'
                          ? `repeating-linear-gradient(45deg, #111317 0 3px, ${f.swatch} 3px 6px)`
                          : f.swatch,
                  }}
                />
                {f.label}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm">Cor dos LEDs</span>
          <div className="flex gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Cor ${c}`}
                onClick={() => onChange({ accent: c })}
                className={`size-6 rounded-full transition ${
                  config.accent === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'hover:scale-110'
                }`}
                style={{ background: c, boxShadow: `0 0 12px ${c}66` }}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Visualização">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-2 p-1">
          {(['solid', 'xray'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ viewMode: mode })}
              className={`rounded-lg py-1.5 text-sm transition ${
                config.viewMode === mode ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {mode === 'solid' ? 'Sólido' : 'Raio-X'}
            </button>
          ))}
        </div>
        <Slider
          label="Vista explodida"
          value={config.explode}
          min={0}
          max={1}
          unit="%"
          onChange={(v) => onChange({ explode: v })}
        />
      </Section>
    </div>
  )
}
