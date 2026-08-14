import { cn } from '../lib/utils'
import { MODULES, type ModuleRow } from '../lib/modules'
import type { ModuleUiState } from '../lib/moduleState'
import { ModuleMark } from './ModuleMark'
import { UiIcon } from './UiIcon'
import { WindowChrome } from './WindowChrome'

export function TitleBar({
  selected,
  busy,
  stateOf,
  onHome,
  onPick,
  onSettings,
  settingsOpen,
}: {
  selected: string | null
  busy: boolean
  stateOf: (id: string) => ModuleUiState
  onHome: () => void
  onPick: (id: string) => void
  onSettings: () => void
  settingsOpen: boolean
}) {
  return (
    <header className={cn('exo-titlebar', busy && 'is-busy')}>
      <button type="button" className="exo-brand exo-no-drag" onClick={onHome} aria-label="Home">
        <img src="./logo.png" alt="" className="exo-brand-logo" width={28} height={28} draggable={false} />
        <div className="exo-brand-text">
          <span className="exo-brand-name">Exo Hub</span>
          <span className="exo-brand-role">Optimizers</span>
        </div>
      </button>

      <nav
        className="exo-no-drag pointer-events-none absolute inset-x-0 flex items-center justify-center gap-2"
        aria-label="Modules"
      >
        <div className="pointer-events-auto flex items-center justify-center gap-2">
          {MODULES.map((m) => (
            <RailButton
              key={m.id}
              m={m}
              missing={stateOf(m.id) === 'missing'}
              on={selected === m.id}
              onPick={onPick}
            />
          ))}
        </div>
      </nav>

      <div className="exo-titlebar-actions">
        <button
          type="button"
          className={cn('exo-winbtn', settingsOpen && 'text-fg')}
          onClick={onSettings}
          aria-label="Settings"
          aria-pressed={settingsOpen}
          title="Settings"
        >
          <UiIcon name="gear" size={15} />
        </button>
        <div className="exo-titlebar-divider" />
        <WindowChrome />
      </div>
    </header>
  )
}

function RailButton({
  m,
  missing,
  on,
  onPick,
}: {
  m: ModuleRow
  missing: boolean
  on: boolean
  onPick: (id: string) => void
}) {
  return (
    <button
      type="button"
      disabled={missing}
      title={missing ? `${m.label} — not installed` : m.label}
      aria-label={m.label}
      aria-disabled={missing || undefined}
      onClick={() => onPick(m.id)}
      className={cn('icon-btn', missing && 'is-missing')}
      data-on={!missing && on ? 'true' : undefined}
    >
      <span className="icon-plate" style={{ background: m.plate }}>
        <ModuleMark m={m} />
      </span>
    </button>
  )
}
