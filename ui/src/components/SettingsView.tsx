import type { CSSProperties } from 'react'
import type { TextColour, TextSize } from '../lib/host'
import type { TextTheme } from '../lib/exoTheme'
import { cn } from '../lib/utils'
import { UiIcon } from './UiIcon'

const FAMILY = [
  { label: 'Exo Launcher', href: 'https://github.com/ImAvgErix/ExoLauncher/releases/latest' },
  { label: 'Exo OS', href: 'https://github.com/ImAvgErix/ExoOS/releases/latest' },
  { label: 'Exo Link', href: 'https://github.com/ImAvgErix/ExoLink/releases/latest' },
] as const

export function SettingsView({
  version,
  theme,
  updateBusy,
  updatePercent,
  updateDone,
  verifyBusy,
  verifySummary,
  onColour,
  onSize,
  onUpdate,
  onVerifyAll,
  onLogs,
  onOpenUrl,
}: {
  version: string
  theme: TextTheme
  updateBusy: boolean
  updatePercent: number
  updateDone: string | null
  verifyBusy: boolean
  verifySummary: string | null
  onColour: (c: TextColour) => void
  onSize: (s: TextSize) => void
  onUpdate: () => void
  onVerifyAll: () => void
  onLogs: () => void
  onOpenUrl: (url: string) => void
}) {
  return (
    <div className="exo-enter mx-auto flex h-full w-full max-w-3xl min-h-0 flex-col overflow-y-auto px-8 py-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <span className="tabular text-[12px] text-faint">v{version}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-medium">App updates</h2>
              <button
                type="button"
                disabled={updateBusy}
                onClick={onUpdate}
                className={cn('exo-cta h-8 px-3 text-[12px]', updateBusy && 'is-active')}
                aria-label="Update Exo"
              >
                {updateBusy && (
                  <span
                    className="absolute inset-y-0 left-0 bg-bg/15"
                    style={{ width: `${updatePercent}%` } as CSSProperties}
                  />
                )}
                <span className="relative z-[1] tabular">
                  {updateBusy
                    ? `${updatePercent}%`
                    : updateDone === 'Failed'
                      ? 'Retry update'
                      : updateDone === 'Up to date'
                        ? 'Up to date'
                        : updateDone === 'Done'
                          ? 'Updated'
                          : 'Update'}
                </span>
              </button>
            </div>
            <p className="text-[12px] text-muted">Checks GitHub, then downloads and installs when a newer build exists.</p>
          </div>

          <div className="h-px bg-line-soft" />

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-medium">Verify all</h2>
              <button
                type="button"
                disabled={verifyBusy}
                onClick={onVerifyAll}
                className="exo-press h-8 rounded-full border border-line px-3 text-[11px] font-semibold hover:bg-hover disabled:opacity-40"
              >
                {verifyBusy ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            <p className="text-[12px] text-muted">
              {verifySummary ?? 'Live-detect every optimizer. Nothing is written.'}
            </p>
          </div>

          <div className="h-px bg-line-soft" />

          <div>
            <h2 className="mb-2 text-[13px] font-medium">Appearance</h2>
            <p className="mb-1.5 text-[11px] font-medium text-muted">Text color</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(['white', 'grey'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onColour(id)}
                  className={cn(
                    'exo-press h-8 rounded-lg border text-[12px] font-semibold',
                    theme.textColour === id ? 'border-fg/40 bg-fg text-bg' : 'border-line text-fg hover:bg-hover',
                  )}
                >
                  {id === 'white' ? 'White' : 'Gray'}
                </button>
              ))}
            </div>
            <p className="mt-2 mb-1.5 text-[11px] font-medium text-muted">Text size</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['small', 'S'],
                  ['normal', 'M'],
                  ['large', 'L'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSize(id)}
                  className={cn(
                    'exo-press h-8 rounded-lg border text-[12px] font-semibold',
                    theme.textSize === id ? 'border-fg/40 bg-fg text-bg' : 'border-line text-fg hover:bg-hover',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="mb-2 text-[13px] font-medium">Help &amp; support</h2>
            <div className="grid grid-cols-2 gap-1.5">
              <SettingsLink icon="fileText" label="View logs" onClick={onLogs} />
              <SettingsLink
                icon="coffee"
                label="Buy me a coffee"
                onClick={() => onOpenUrl('https://www.buymeacoffee.com/UhhErix')}
              />
              <SettingsLink
                icon="heart"
                label="Sponsor"
                onClick={() => onOpenUrl('https://github.com/sponsors/ImAvgErix')}
              />
              <SettingsLink
                icon="shield"
                label="Changelog"
                onClick={() => onOpenUrl('https://github.com/ImAvgErix/ExoHub/releases')}
              />
            </div>
          </div>

          <div className="h-px bg-line-soft" />

          <div>
            <h2 className="mb-2 text-[13px] font-medium">Exo family</h2>
            <div className="grid grid-cols-1 divide-y divide-line-soft">
              {FAMILY.map((row) => (
                <button
                  key={row.label}
                  type="button"
                  className="exo-settings-link"
                  onClick={() => onOpenUrl(row.href)}
                >
                  <UiIcon name="arrowUpRight" size={16} />
                  {row.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function SettingsLink({
  icon,
  label,
  onClick,
}: {
  icon: 'fileText' | 'coffee' | 'heart' | 'shield'
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className="exo-settings-link" onClick={onClick}>
      <UiIcon name={icon} size={16} />
      {label}
    </button>
  )
}
