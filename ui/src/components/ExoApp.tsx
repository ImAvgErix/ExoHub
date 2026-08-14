/**
 * Exo Hub shell — Launcher-grade chrome, wired to the host bridge.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  host,
  onHostEvent,
  type DashboardSnapshot,
  type LiveStats,
  type ModuleId,
  type ModuleStatus,
  type TextColour,
  type TextSize,
} from '../lib/host'
import { applyTextTheme, readCachedTextTheme, textThemeFrom, type TextTheme } from '../lib/exoTheme'
import { MODULES, moduleById } from '../lib/modules'
import {
  rankFeatureLines,
  stateFromDash,
  stateFromStatus,
  type ModuleUiState,
} from '../lib/moduleState'
import { HomeView } from './HomeView'
import { OptimizerView } from './OptimizerView'
import { SettingsView } from './SettingsView'
import { TitleBar } from './TitleBar'

type View = 'home' | 'module' | 'settings'

export function ExoApp() {
  const [states, setStates] = useState<Record<string, ModuleUiState>>(() =>
    Object.fromEntries(MODULES.map((m) => [m.id, 'ready' as ModuleUiState])),
  )
  const [picks, setPicks] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<View>('home')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [dash, setDash] = useState<DashboardSnapshot | null>(null)
  const [live, setLive] = useState<LiveStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState('—')
  const [theme, setTheme] = useState<TextTheme>(readCachedTextTheme)
  const [updateBusy, setUpdateBusy] = useState(false)
  const [updatePercent, setUpdatePercent] = useState(0)
  const [updateDone, setUpdateDone] = useState<string | null>(null)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifySummary, setVerifySummary] = useState<string | null>(null)

  // Default ready so icons stay clickable before the first dashboard tick.
  // Missing is only applied after a real host answer — never as a loading placeholder.
  const stateOf = useCallback((id: string) => states[id] ?? 'ready', [states])
  const active = selected ? moduleById(selected) : null
  const activeState = active ? stateOf(active.id) : null

  useEffect(() => {
    applyTextTheme(theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    void host.getSettings().then((s) => {
      if (cancelled) return
      if (s.appVersion) setVersion(s.appVersion)
      setTheme(textThemeFrom(s, readCachedTextTheme()))
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const next = await host.getDashboard()
          if (cancelled) return
          setDash(next)
          const map: Record<string, ModuleUiState> = {}
          for (const row of next.modules) map[row.id] = stateFromDash(row)
          setStates((prev) => ({ ...prev, ...map }))
          return
        } catch (e) {
          if (attempt === 3 && !cancelled) {
            setError(e instanceof Error ? e.message : 'Failed to load dashboard')
          } else {
            await new Promise((r) => window.setTimeout(r, 250 * (attempt + 1)))
          }
        }
      }
    }
    void boot()
    const tick = async () => {
      try {
        const l = await host.getLive()
        if (!cancelled) setLive(l)
      } catch {
        /* best effort */
      }
    }
    const liveBoot = window.setTimeout(() => void tick(), 400)
    const interval = window.setInterval(() => void tick(), 1500)
    return () => {
      cancelled = true
      window.clearTimeout(liveBoot)
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (view !== 'module' || !selected) {
      setModuleStatus(null)
      setError(null)
      return
    }
    let cancelled = false
    const id = selected as ModuleId
    setDetecting(true)
    setError(null)
    setModuleStatus(null)
    setStates((s) => ({ ...s, [id]: 'checking' }))
    ;(async () => {
      try {
        const next = await host.detect(id, { force: true })
        if (cancelled) return
        setModuleStatus(next)
        setStates((s) => ({ ...s, [id]: stateFromStatus(next) }))
        if (next.options?.useGsync != null) {
          setPicks((p) => ({ ...p, nvidia: next.options?.useGsync ? 0 : 1 }))
        }
        if (next.options?.preferLowestLatency != null) {
          setPicks((p) => ({
            ...p,
            internet: next.options?.preferLowestLatency ? 0 : 1,
          }))
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Detect failed')
          setStates((s) => ({ ...s, [id]: 'ready' }))
        }
      } finally {
        if (!cancelled) setDetecting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selected, view])

  useEffect(() => {
    return onHostEvent('module.progress', (data) => {
      const event = data as { module?: string; percent?: number; status?: string }
      if (event.module && busyId && event.module !== busyId) return
      if (typeof event.percent === 'number' && event.percent >= 0) {
        setProgress(Math.min(99, event.percent))
      }
    })
  }, [busyId])

  const stop = useCallback(async () => {
    if (!busyId) return
    try {
      await host.cancel(busyId as ModuleId)
    } catch {
      /* settling */
    }
  }, [busyId])

  const run = useCallback(
    async (id: string, mode: 'apply' | 'repair' = 'apply') => {
      if (busyId) return
      setBusyId(id)
      setProgress(4)
      setError(null)
      const def = moduleById(id)
      const pick = picks[id] ?? 0
      const options: Record<string, unknown> = { experimental: true, ...(def?.applyOptions?.(pick) ?? {}) }

      try {
        let next: ModuleStatus
        if (mode === 'repair') next = await host.repair(id as ModuleId)
        else next = await host.apply(id as ModuleId, options)
        setProgress(92)
        next = await host.detect(id as ModuleId, { force: true })
        setModuleStatus(next)
        setStates((s) => ({ ...s, [id]: stateFromStatus(next) }))
        setProgress(100)
        try {
          setDash(await host.getDashboard())
        } catch {
          /* ignore */
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : `${mode} failed`)
      } finally {
        setBusyId(null)
        setProgress(0)
      }
    },
    [busyId, picks],
  )

  const runVerify = useCallback(
    async (id: string) => {
      if (busyId) return
      setBusyId(id)
      setProgress(20)
      setDetecting(true)
      try {
        const next = await host.detect(id as ModuleId, { force: true })
        setModuleStatus(next)
        setStates((s) => ({ ...s, [id]: stateFromStatus(next) }))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Verify failed')
      } finally {
        setBusyId(null)
        setProgress(0)
        setDetecting(false)
      }
    },
    [busyId],
  )

  const pick = (id: string) => {
    if (stateOf(id) === 'missing') return
    setSelected(id)
    setView('module')
  }

  const goHome = () => {
    setSelected(null)
    setView('home')
  }

  useEffect(() => {
    return onHostEvent('settings.updateProgress', (data) => {
      const event = data as { percent?: number }
      if (typeof event.percent === 'number' && event.percent >= 0) {
        setUpdatePercent(Math.min(100, Math.round(event.percent)))
      }
    })
  }, [])

  const runUpdate = useCallback(async () => {
    if (updateBusy) return
    setUpdateBusy(true)
    setUpdatePercent(0)
    setUpdateDone(null)
    try {
      const result = await host.installUpdate()
      setUpdatePercent(100)
      if (result.alreadyLatest) {
        setUpdateDone('Up to date')
      } else if (result.installed || result.shouldExit) {
        setUpdateDone('Done')
      } else if (!result.updateAvailable) {
        setUpdateDone('Up to date')
      } else {
        setUpdateDone('Done')
      }
    } catch {
      setUpdateDone('Failed')
    } finally {
      setUpdateBusy(false)
    }
  }, [updateBusy])

  const runVerifyAll = useCallback(async () => {
    if (verifyBusy) return
    setVerifyBusy(true)
    try {
      const result = await host.verifyAll()
      setVerifySummary(result.summary)
      const map: Record<string, ModuleUiState> = {}
      for (const row of result.results ?? []) {
        if (row?.id) map[row.id] = stateFromStatus(row)
      }
      setStates((prev) => ({ ...prev, ...map }))
      try {
        setDash(await host.getDashboard())
      } catch {
        /* ignore */
      }
    } catch (e) {
      setVerifySummary(e instanceof Error ? e.message : 'Verify all failed')
    } finally {
      setVerifyBusy(false)
    }
  }, [verifyBusy])

  const setColour = (textColour: TextColour) => {
    const next = { ...theme, textColour }
    applyTextTheme(next)
    setTheme(next)
    void host.setSettings({ textColour }).catch(() => {})
  }

  const setSize = (textSize: TextSize) => {
    const next = { ...theme, textSize }
    applyTextTheme(next)
    setTheme(next)
    void host.setSettings({ textSize }).catch(() => {})
  }

  const openLogs = () => {
    void host.openLogs().catch(() => setError('Could not open logs folder'))
  }

  const openUrl = (url: string) => {
    void host.openUrl(url).catch(() => {
      window.open(url, '_blank', 'noopener,noreferrer')
    })
  }

  const doesLines = useMemo(
    () => rankFeatureLines(moduleStatus?.features, active?.does ?? []),
    [active, moduleStatus],
  )

  return (
    <div className="exo-app relative flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <div className="exo-ambient" aria-hidden />
      <TitleBar
        selected={view === 'module' ? selected : null}
        busy={!!busyId || updateBusy || verifyBusy}
        stateOf={stateOf}
        onHome={goHome}
        onPick={pick}
        onSettings={() => setView((v) => (v === 'settings' ? 'home' : 'settings'))}
        settingsOpen={view === 'settings'}
      />

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === 'settings' && (
          <SettingsView
            version={version}
            theme={theme}
            updateBusy={updateBusy}
            updatePercent={updatePercent}
            updateDone={updateDone}
            verifyBusy={verifyBusy}
            verifySummary={verifySummary}
            onColour={setColour}
            onSize={setSize}
            onUpdate={() => void runUpdate()}
            onVerifyAll={() => void runVerifyAll()}
            onLogs={openLogs}
            onOpenUrl={openUrl}
          />
        )}

        {view === 'home' && (
          <HomeView dash={dash} live={live} error={error} stateOf={stateOf} onPick={pick} />
        )}

        {view === 'module' && active && activeState && (
          <OptimizerView
            active={active}
            activeState={activeState}
            detecting={detecting}
            busyId={busyId}
            progress={progress}
            error={error}
            doesLines={doesLines}
            pick={picks[active.id] ?? 0}
            onPick={(i) => setPicks((p) => ({ ...p, [active.id]: i }))}
            onVerify={() => void runVerify(active.id)}
            onRepair={() => void run(active.id, 'repair')}
            onApplyOrStop={() =>
              busyId === active.id ? void stop() : void run(active.id, 'apply')
            }
            onOpenLogs={() => void host.openLogs()}
            statusReason={moduleStatus?.statusReason}
            statusDetail={moduleStatus?.detail}
          />
        )}
      </main>
    </div>
  )
}
