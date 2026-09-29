import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { Telemetry } from './components/Telemetry'
import { FINGERS, FINISHES, GRIP_PRESETS } from './data/presets'
import type { FingerId, FingerPose, SimulatorConfig, Theme } from './types'

const Scene = lazy(() => import('./components/Scene').then((m) => ({ default: m.Scene })))

const DEFAULT_CONFIG: SimulatorConfig = {
  pose: GRIP_PRESETS[0].pose,
  finish: 'carbon',
  accent: '#b794ff',
  viewMode: 'solid',
  explode: 0,
  wristRotation: -18,
  wristFlex: 0,
  motorPower: 0.7,
}

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'glass', label: 'Glass' },
]

function loadConfigFromHash(): SimulatorConfig {
  try {
    const raw = window.location.hash.replace(/^#cfg=/, '')
    if (!raw || raw === window.location.hash) return DEFAULT_CONFIG
    const parsed = JSON.parse(atob(decodeURIComponent(raw))) as Partial<SimulatorConfig>
    return { ...DEFAULT_CONFIG, ...parsed, pose: { ...DEFAULT_CONFIG.pose, ...parsed.pose } }
  } catch {
    return DEFAULT_CONFIG
  }
}

function matchPreset(pose: FingerPose): string | null {
  const hit = GRIP_PRESETS.find((p) => FINGERS.every((f) => Math.abs(p.pose[f.id] - pose[f.id]) < 0.005))
  return hit?.id ?? null
}

export default function App() {
  const [config, setConfig] = useState<SimulatorConfig>(loadConfigFromHash)
  const [hovered, setHovered] = useState<FingerId | null>(null)
  const [demo, setDemo] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('hps-theme') as Theme) || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('hps-theme', theme)
    } catch {
      /* armazenamento indisponível */
    }
  }, [theme])

  const activePreset = useMemo(() => matchPreset(config.pose), [config.pose])

  const patch = useCallback((p: Partial<SimulatorConfig>) => setConfig((c) => ({ ...c, ...p })), [])

  const applyPreset = useCallback((id: string) => {
    const preset = GRIP_PRESETS.find((p) => p.id === id)
    if (preset) setConfig((c) => ({ ...c, pose: preset.pose }))
  }, [])

  const setFinger = useCallback((id: FingerId, value: number) => {
    setDemo(false)
    setConfig((c) => ({ ...c, pose: { ...c.pose, [id]: value } }))
  }, [])

  const toggleFinger = useCallback((id: FingerId) => {
    setDemo(false)
    setConfig((c) => ({ ...c, pose: { ...c.pose, [id]: c.pose[id] > 0.5 ? 0 : 1 } }))
  }, [])

  // Modo demo: percorre os padrões de preensão.
  useEffect(() => {
    if (!demo) return
    let i = Math.max(0, GRIP_PRESETS.findIndex((p) => p.id === activePreset))
    const timer = window.setInterval(() => {
      i = (i + 1) % GRIP_PRESETS.length
      applyPreset(GRIP_PRESETS[i].id)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [demo, applyPreset])

  // Atalhos: 1–7 padrões, X raio-x, E vista explodida, D demo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= GRIP_PRESETS.length) {
        setDemo(false)
        applyPreset(GRIP_PRESETS[n - 1].id)
      } else if (e.key.toLowerCase() === 'x') {
        setConfig((c) => ({ ...c, viewMode: c.viewMode === 'xray' ? 'solid' : 'xray' }))
      } else if (e.key.toLowerCase() === 'e') {
        setConfig((c) => ({ ...c, explode: c.explode > 0.5 ? 0 : 1 }))
      } else if (e.key.toLowerCase() === 'd') {
        setDemo((d) => !d)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [applyPreset])

  const shareConfig = async () => {
    const encoded = encodeURIComponent(btoa(JSON.stringify(config)))
    const url = `${window.location.origin}${window.location.pathname}#cfg=${encoded}`
    window.history.replaceState(null, '', `#cfg=${encoded}`)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* a URL já está na barra de endereços */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'protese-config.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const finishLabel = FINISHES.find((f) => f.id === config.finish)?.label
  const presetLabel = GRIP_PRESETS.find((p) => p.id === activePreset)?.label ?? 'Personalizado'

  return (
    <div className="min-h-screen">
      {/* ---------- Aviso de protótipo ---------- */}
      <div className="border-b border-line bg-surface-2">
        <p className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-4 py-2 text-center text-xs text-muted sm:px-6">
          <span className="rounded-full border border-accent px-2 py-0.5 font-mono text-[10px] tracking-wider text-accent uppercase">
            Protótipo
          </span>
          Este é um projeto de estudos feito para testar React, TypeScript e Three.js. Os dados são fictícios.
        </p>
      </div>

      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">
              Julia <span className="text-muted">Nascimento</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#simulador" className="transition hover:text-ink">Simulador</a>
            <a href="#engenharia" className="transition hover:text-ink">Engenharia</a>
            <a href="#configuracao" className="transition hover:text-ink">Sua configuração</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-line bg-surface p-0.5" role="radiogroup" aria-label="Tema">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.id}
                  onClick={() => setTheme(t.id)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition sm:px-3 ${
                    theme === t.id ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <a
              href="#configuracao"
              className="hidden rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition hover:brightness-110 sm:block"
            >
              Salvar configuração
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ---------- Hero + simulador ---------- */}
        <section id="simulador" className="mx-auto max-w-[1440px] px-4 pt-10 pb-16 sm:px-6 lg:pt-14">
          <div className="rise mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 font-mono text-xs tracking-[0.18em] text-accent uppercase">
                Protótipo de estudos · WebGL
              </p>
              <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Hand Prosthesis
                <br />
                <span className="text-muted">Simulator</span>
              </h1>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-muted">
              Protótipo criado como teste de estudos: uma prótese de mão simulada em 3D. Ajuste cada articulação,
              teste padrões de preensão e inspecione o mecanismo interno — tudo em tempo real, no navegador.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex flex-col gap-4">
              <div className="panel relative h-[460px] overflow-hidden rounded-2xl sm:h-[560px] lg:h-[640px]">
                <GridBackdrop />
                <Suspense
                  fallback={
                    <div className="absolute inset-0 grid place-items-center font-mono text-xs text-muted">
                      Carregando modelo…
                    </div>
                  }
                >
                  <Scene
                    config={config}
                    hovered={hovered}
                    onHover={setHovered}
                    onToggleFinger={toggleFinger}
                    autoRotate={autoRotate}
                  />
                </Suspense>

                {/* HUD */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-5">
                  <div className="font-mono text-[11px] leading-5 text-muted">
                    <div className="text-ink">Protótipo v0.1 · {finishLabel}</div>
                    <div>Padrão: <span className="text-accent">{presetLabel}</span></div>
                    <div>Modo: {config.viewMode === 'xray' ? 'Raio-X' : 'Sólido'}</div>
                  </div>
                  <div className="text-right font-mono text-[11px] leading-5 text-muted">
                    <div>{hovered ? FINGERS.find((f) => f.id === hovered)?.label : 'Clique em um dedo'}</div>
                    {hovered && <div className="text-accent">{Math.round(config.pose[hovered] * 100)}% flexão</div>}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-4 sm:p-5">
                  <div className="flex gap-2">
                    <HudButton active={autoRotate} onClick={() => setAutoRotate((a) => !a)}>
                      Auto-rotação
                    </HudButton>
                    <HudButton
                      active={config.viewMode === 'xray'}
                      onClick={() => patch({ viewMode: config.viewMode === 'xray' ? 'solid' : 'xray' })}
                    >
                      Raio-X <kbd className="opacity-50">X</kbd>
                    </HudButton>
                    <HudButton active={config.explode > 0.5} onClick={() => patch({ explode: config.explode > 0.5 ? 0 : 1 })}>
                      Explodir <kbd className="opacity-50">E</kbd>
                    </HudButton>
                  </div>
                  <span className="hidden font-mono text-[10px] text-muted sm:block">Arraste para orbitar · Role para zoom</span>
                </div>
              </div>

              <Telemetry pose={config.pose} motorPower={config.motorPower} accent={config.accent} />
            </div>

            <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
              <ControlPanel
                config={config}
                activePreset={activePreset}
                hovered={hovered}
                demo={demo}
                onChange={patch}
                onFinger={setFinger}
                onPreset={(id) => {
                  setDemo(false)
                  applyPreset(id)
                }}
                onDemo={setDemo}
              />
            </aside>
          </div>
        </section>

        {/* ---------- Prova / engenharia ---------- */}
        <section id="engenharia" className="border-t border-line">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6">
            <div className="mb-12 grid gap-6 lg:grid-cols-2">
              <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Engenharia que responde
                <br />
                <span className="text-muted">na velocidade da intenção.</span>
              </h2>
              <p className="max-w-lg self-end text-[15px] leading-relaxed text-muted">
                Neste protótipo, cada dedo simula um micromotor independente com tendões internos e sensores táteis nas
                pontas. Os números abaixo são ilustrativos e servem apenas para o estudo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
              {[
                { value: '11', unit: 'DoF', label: 'Graus de liberdade ativos' },
                { value: '90', unit: 'N', label: 'Força máxima de preensão' },
                { value: '24', unit: 'ms', label: 'Latência sinal → movimento' },
                { value: '480', unit: 'g', label: 'Peso com bateria' },
              ].map((s) => (
                <div key={s.label} className="bg-surface p-6 backdrop-blur-xl sm:p-8">
                  <div className="font-mono text-4xl tracking-tight sm:text-5xl">
                    {s.value}
                    <span className="ml-1 text-lg text-accent">{s.unit}</span>
                  </div>
                  <div className="mt-2 text-sm text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                {
                  k: '01',
                  title: 'Controle mioelétrico',
                  body: 'Dois eletrodos lêem a atividade muscular do antebraço e um classificador mapeia padrões em 7 gestos.',
                },
                {
                  k: '02',
                  title: 'Feedback tátil',
                  body: 'Sensores de pressão nas falanges distais evitam esmagar objetos frágeis — de um copo plástico a um ovo.',
                },
                {
                  k: '03',
                  title: 'Punho rotativo',
                  body: 'Pronação e supinação motorizadas de ±90°, com encaixe rápido compatível com soquetes padrão.',
                },
              ].map((f) => (
                <article key={f.k} className="panel rounded-2xl p-6">
                  <div className="mb-8 font-mono text-xs text-accent">{f.k}</div>
                  <h3 className="mb-2 text-lg font-medium">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Ação final ---------- */}
        <section id="configuracao" className="border-t border-line">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6">
            <div className="panel grid gap-10 rounded-3xl p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:p-14">
              <div>
                <p className="mb-3 font-mono text-xs tracking-[0.18em] text-accent uppercase">Teste do protótipo</p>
                <h2 className="mb-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                  Salve a configuração do seu teste.
                </h2>
                <p className="mb-8 max-w-lg text-[15px] leading-relaxed text-muted">
                  Gere um link com todos os parâmetros definidos no simulador ou exporte um arquivo JSON para comparar
                  experimentos e registrar o que você aprendeu.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={shareConfig}
                    className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition hover:brightness-110"
                  >
                    {copied ? 'Link copiado ✓' : 'Copiar link da configuração'}
                  </button>
                  <button
                    type="button"
                    onClick={exportConfig}
                    className="rounded-full border border-line px-6 py-3 text-sm font-medium transition hover:border-ink"
                  >
                    Exportar JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig(DEFAULT_CONFIG)}
                    className="rounded-full px-4 py-3 text-sm text-muted transition hover:text-ink"
                  >
                    Restaurar padrão
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 self-center rounded-2xl border border-line bg-surface-2 p-6 font-mono text-sm">
                <SpecRow label="Acabamento" value={finishLabel ?? ''} />
                <SpecRow
                  label="LEDs"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: config.accent }} />
                      {config.accent.toUpperCase()}
                    </span>
                  }
                />
                <SpecRow label="Preensão" value={presetLabel} />
                <SpecRow label="Motor" value={`${Math.round(config.motorPower * 100)}%`} />
                <SpecRow label="Pronação" value={`${config.wristRotation}°`} />
                <SpecRow label="Flexão punho" value={`${config.wristFlex}°`} />
                <div className="col-span-2 border-t border-line pt-4">
                  <dt className="mb-2 text-[11px] text-muted uppercase">Flexão por dedo</dt>
                  <dd className="flex justify-between">
                    {FINGERS.map((f) => (
                      <span key={f.id} className="text-center">
                        <span className="block text-ink tabular-nums">{Math.round(config.pose[f.id] * 100)}</span>
                        <span className="text-[10px] text-muted uppercase">{f.label.slice(0, 3)}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-8 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <span>Julia Nascimento — protótipo feito para estudos. Projeto de teste, não é um dispositivo médico.</span>
          <span className="font-mono">Atalhos: 1–7 preensão · X raio-x · E explodir · D demo</span>
        </div>
      </footer>
    </div>
  )
}

function HudButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 font-mono text-[11px] backdrop-blur-md transition ${
        active ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-bg/40 text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-muted uppercase">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  )
}

function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-50"
      style={{
        backgroundImage:
          'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }}
    />
  )
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="25" height="25" rx="7" className="fill-surface stroke-line" />
      <path d="M8 18V9.5M11.5 18V7M15 18V8M18.5 18v-6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
