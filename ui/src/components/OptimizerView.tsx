import { ACTION_WORD, STATUS_WORD, staleCopy, type FeatureLine, type ModuleUiState } from '../lib/moduleState'
import type { ModuleRow } from '../lib/modules'
import { cn } from '../lib/utils'
import { ModuleMark } from './ModuleMark'
import { UiIcon } from './UiIcon'

export function OptimizerView({
  active,
  activeState,
  detecting,
  busyId,
  progress,
  error,
  doesLines,
  pick,
  onPick,
  onVerify,
  onRepair,
  onApplyOrStop,
  onOpenLogs,
  statusReason,
  statusDetail,
}: {
  active: ModuleRow
  activeState: ModuleUiState
  detecting: boolean
  busyId: string | null
  progress: number
  error: string | null
  doesLines: FeatureLine[]
  pick: number
  onPick: (index: number) => void
  onVerify: () => void
  onRepair: () => void
  onApplyOrStop: () => void
  onOpenLogs: () => void
  statusReason?: string
  statusDetail?: string
}) {
  const stale = staleCopy(statusReason)
  const running = busyId === active.id

  return (
    <div className="exo-enter flex min-h-0 flex-1 flex-col overflow-hidden px-8 py-6">
      <div className="mx-auto flex h-full w-full max-w-lg min-h-0 flex-col">
        <div className="flex shrink-0 flex-col items-center text-center">
          <div
            className="grid size-16 place-items-center overflow-hidden"
            style={{ borderRadius: 'var(--radius-ui)', background: active.plate }}
          >
            <span className="icon-plate">
              <ModuleMark m={active} />
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <h1 className="text-[26px] font-semibold tracking-tight">{active.label}</h1>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                activeState === 'applied' && 'bg-good/15 text-good',
                (activeState === 'ready' || activeState === 'partial') && 'bg-fg/10 text-fg',
                activeState === 'blocked' && 'bg-bad/15 text-bad',
                activeState === 'missing' && 'bg-faint/20 text-muted',
                activeState === 'checking' && 'bg-fg/10 text-muted',
              )}
            >
              {detecting || activeState === 'checking' ? 'Checking…' : STATUS_WORD[activeState]}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 max-w-md text-[13px] text-muted">
            {statusDetail || active.summary}
          </p>
          {stale && <p className="mt-1.5 max-w-md text-[12px] text-fg/80">{stale}</p>}
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="card min-h-0 flex-1 overflow-hidden p-4">
            <p className="text-[12px] font-medium text-muted">
              {doesLines.some((l) => l.active !== undefined) ? 'Status' : 'What this does'}
            </p>
            <ul className="mt-3 max-h-full space-y-2 overflow-y-auto">
              {doesLines.map((line) => {
                const off = line.active === false && !line.info
                const on = line.active === true || !!line.info
                return (
                  <li key={line.key} className="flex items-start gap-2.5 text-[13px] leading-snug text-fg/90">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{
                        background: off
                          ? 'var(--color-bad)'
                          : on
                            ? 'var(--color-good)'
                            : 'var(--color-faint)',
                      }}
                    />
                    <span className="line-clamp-3">{line.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {active.options && (
            <div className="shrink-0">
              <p className="mb-2 text-[12px] font-medium text-muted">Profile</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Profile">
                {active.options.map((opt, i) => {
                  const sel = pick === i
                  return (
                    <button
                      key={opt[0]}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      disabled={!!busyId || detecting}
                      onClick={() => onPick(i)}
                      className={cn(
                        'card exo-press flex items-start gap-3 p-3.5 text-left',
                        sel ? 'border-fg/40 bg-elevated' : 'hover:bg-hover',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border',
                          sel ? 'border-fg bg-fg text-bg' : 'border-faint',
                        )}
                      >
                        {sel && <UiIcon name="check" size={12} weight="bold" />}
                      </span>
                      <span>
                        <span className="block text-[13px] font-semibold">{opt[0]}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted">{opt[1]}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="card shrink-0 border-bad/30 p-3 text-[12px] text-bad">
              {error.split('\n')[0]}
              <button
                type="button"
                className="mt-1.5 block text-[12px] font-semibold text-fg underline"
                onClick={onOpenLogs}
              >
                Open logs
              </button>
            </div>
          )}

          {activeState !== 'missing' && (
            <div className="mt-auto flex shrink-0 flex-col items-center gap-2.5 pt-1">
              <div className="flex w-full max-w-sm items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={!!busyId || detecting}
                  onClick={onVerify}
                  className="exo-press h-10 min-w-[6.5rem] flex-1 rounded-full border border-line px-5 text-[13px] font-semibold hover:bg-hover disabled:opacity-40"
                >
                  Verify
                </button>
                {(activeState === 'applied' ||
                  activeState === 'blocked' ||
                  activeState === 'partial') && (
                  <button
                    type="button"
                    disabled={!!busyId || detecting}
                    onClick={onRepair}
                    className="exo-press h-10 min-w-[6.5rem] flex-1 rounded-full border border-line px-5 text-[13px] font-semibold hover:bg-hover disabled:opacity-40"
                  >
                    Repair
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={detecting && busyId !== active.id}
                onClick={onApplyOrStop}
                className={cn('exo-cta w-full max-w-sm', running && 'is-active')}
              >
                {running && (
                  <span
                    className="absolute inset-y-0 left-0 bg-bg/15"
                    style={{ width: `${Math.round(progress)}%` }}
                  />
                )}
                <span className="relative z-[1] tabular">
                  {running ? `${Math.round(progress)}%` : ACTION_WORD[activeState] || 'Apply'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
