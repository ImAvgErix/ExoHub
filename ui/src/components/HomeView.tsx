import { MODULES } from '../lib/modules'
import { STATUS_WORD, type ModuleUiState } from '../lib/moduleState'
import type { DashboardSnapshot, FirmwareFinding, LiveStats } from '../lib/host'
import { cn } from '../lib/utils'
import { Meter } from './Meter'
import { ModuleMark } from './ModuleMark'

export function HomeView({
  dash,
  live,
  error,
  stateOf,
  onPick,
}: {
  dash: DashboardSnapshot | null
  live: LiveStats | null
  error: string | null
  stateOf: (id: string) => ModuleUiState
  onPick: (id: string) => void
}) {
  const specs = dash?.specs
  const cpuPct = live?.hasCpu === false ? 0 : Math.round(live?.cpuPercent ?? 0)
  const gpuPct = live?.hasGpu === false ? 0 : Math.round(live?.gpuPercent ?? 0)
  const memPct = Math.round(live?.memoryPercent ?? 0)
  const diskPct = live?.hasDisk === false ? 0 : Math.round(live?.diskPercent ?? 0)
  const firmware = (dash?.firmware ?? []).filter((f) => f.ok === false)

  return (
    <div className="exo-enter flex min-h-0 flex-1 flex-col overflow-hidden px-8 py-6">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4" aria-label="This PC">
        {error && !dash && <div className="card p-4 text-[13px] text-bad">{error}</div>}

        <div className="grid grid-cols-4 gap-3">
          <Meter label="CPU" value={cpuPct} detail={specs?.cpu || '—'} />
          <Meter label="GPU" value={gpuPct} detail={specs?.gpu || '—'} />
          <Meter label="Memory" value={memPct} detail={live?.memorySecondary || specs?.ram || '—'} />
          <Meter label="Disk" value={diskPct} detail={live?.diskSecondary || live?.diskUsed || 'Storage'} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card col-span-2 flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[12px] text-muted">Down</p>
                <p className="tabular text-[1.5rem] font-semibold tracking-tight">
                  {live?.netDownMbps != null ? Math.round(live.netDownMbps) : '—'}
                  <span className="ml-1 text-[12px] font-medium text-muted">Mb/s</span>
                </p>
              </div>
              <div>
                <p className="text-[12px] text-muted">Up</p>
                <p className="tabular text-[1.5rem] font-semibold tracking-tight">
                  {live?.netUpMbps != null ? Math.round(live.netUpMbps) : '—'}
                  <span className="ml-1 text-[12px] font-medium text-muted">Mb/s</span>
                </p>
              </div>
              <div>
                <p className="text-[12px] text-muted">Idle</p>
                <p className="tabular text-[1.5rem] font-semibold tracking-tight">
                  {live?.netIdleMsValue != null && live.netIdleMsValue > 0
                    ? live.netIdleMsValue.toFixed(0)
                    : '—'}
                  <span className="ml-1 text-[12px] font-medium text-muted">ms</span>
                </p>
              </div>
            </div>
            <p className="truncate text-right text-[12px] text-faint">
              {[live?.netLink, live?.netRating].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <div className="card flex flex-col justify-center px-5 py-4">
            <p className="truncate text-[14px] font-semibold">{specs?.os || 'Windows'}</p>
            {dash?.overview && <p className="mt-1 truncate text-[12px] text-muted">{dash.overview}</p>}
          </div>
        </div>

        {dash?.next && (
          <button
            type="button"
            onClick={() => onPick(dash.next!.id)}
            className="card exo-press flex shrink-0 items-center justify-between gap-4 px-5 py-3 text-left"
          >
            <span className="min-w-0">
              <span className="block text-[12px] font-medium text-muted">Next</span>
              <span className="mt-0.5 block truncate text-[14px] font-semibold">{dash.next.label}</span>
            </span>
            <span className="shrink-0 text-[12px] font-semibold">Open</span>
          </button>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          <p className="mb-2 text-[12px] font-medium text-muted">On this PC</p>
          <div className="grid grid-cols-4 gap-2">
            {MODULES.map((m) => {
              const state = stateOf(m.id)
              const missing = state === 'missing'
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={missing}
                  onClick={() => onPick(m.id)}
                  className={cn(
                    'card exo-press flex items-center gap-3 p-3 text-left',
                    missing && 'opacity-40 grayscale',
                  )}
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center overflow-hidden"
                    style={{ borderRadius: 10, background: m.plate }}
                  >
                    <span className="icon-plate">
                      <ModuleMark m={m} />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{m.label}</span>
                    <span
                      className={cn(
                        'mt-0.5 block text-[11px] font-medium',
                        state === 'applied' && 'text-good',
                        state === 'blocked' && 'text-bad',
                        state === 'partial' && 'text-fg',
                        (state === 'ready' || state === 'checking') && 'text-muted',
                        missing && 'text-faint',
                      )}
                    >
                      {STATUS_WORD[state]}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {firmware.length > 0 && <FirmwareStrip findings={firmware} />}
      </div>
    </div>
  )
}

function FirmwareStrip({ findings }: { findings: FirmwareFinding[] }) {
  return (
    <div className="card shrink-0 px-4 py-3">
      <p className="text-[12px] font-medium text-muted">Firmware — Exo can read these, not set them</p>
      <ul className="mt-2 space-y-1.5">
        {findings.slice(0, 3).map((f) => (
          <li key={f.id} className="text-[12px] leading-snug text-fg/90">
            <span className="font-semibold">{f.title}</span>
            <span className="text-muted"> — {f.fixWhere || f.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
