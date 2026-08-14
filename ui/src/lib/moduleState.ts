import type { DashboardSnapshot, ModuleStatus } from './host'

/** Shell words plus the two in-flight states the detail page needs. */
export type ModuleUiState = 'applied' | 'ready' | 'blocked' | 'missing' | 'partial' | 'checking'

export const STATUS_WORD: Record<ModuleUiState, string> = {
  applied: 'Applied',
  ready: 'Ready',
  blocked: 'Blocked',
  missing: 'Missing',
  partial: 'Partial',
  checking: 'Checking…',
}

export const ACTION_WORD: Record<ModuleUiState, string> = {
  applied: 'Reapply',
  ready: 'Apply',
  blocked: 'Retry',
  missing: '',
  partial: 'Apply',
  checking: 'Apply',
}

export function stateFromStatus(s: ModuleStatus | undefined | null): ModuleUiState {
  if (!s) return 'ready'
  const kind = (s.statusKind || '').toLowerCase()
  if (kind === 'missing' || /not installed/i.test(`${s.statusText} ${s.detail}`)) return 'missing'
  if (kind === 'blocked') return 'blocked'
  if (kind === 'partial') return 'partial'
  if (kind === 'applied' || s.isApplied) return 'applied'
  return 'ready'
}

export function stateFromDash(m: DashboardSnapshot['modules'][number] | undefined): ModuleUiState {
  if (!m) return 'ready'
  if (m.state === 'missing') return 'missing'
  if (m.state === 'blocked') return 'blocked'
  if (m.state === 'partial') return 'partial'
  if (m.state === 'applied' || m.applied) return 'applied'
  return 'ready'
}

export type FeatureLine = {
  key: string
  text: string
  active?: boolean
  /** Identity / advisory — never a red fail dot. */
  info?: boolean
}

export function isInfoTitle(title: string): boolean {
  return (
    /\(info\)$/i.test(title) ||
    /\(firmware\)$/i.test(title) ||
    /^(CPU|Radeon GPU|AMD platform|Control Panel access|Matched to your display)\b/i.test(title)
  )
}

export function rankFeatureLines(
  features: Array<{ title: string; detail: string; active: boolean }> | undefined,
  fallback: string[],
): FeatureLine[] {
  if (features?.length) {
    const ranked = [...features].sort((a, b) => {
      const aTitle = (a.title || '').trim()
      const bTitle = (b.title || '').trim()
      const aInfo = isInfoTitle(aTitle)
      const bInfo = isInfoTitle(bTitle)
      const aOff = a.active === false && !aInfo
      const bOff = b.active === false && !bInfo
      if (aOff !== bOff) return aOff ? -1 : 1
      if (aInfo !== bInfo) return aInfo ? 1 : -1
      return 0
    })
    return ranked
      .map((f, i) => {
        const title = (f.title || '').trim()
        const detail = (f.detail || '').trim()
        const text =
          title && detail && !detail.toLowerCase().startsWith(title.toLowerCase())
            ? `${title}: ${detail}`
            : title || detail
        return { key: `${title}-${i}`, text, active: f.active, info: isInfoTitle(title) }
      })
      .filter((x) => x.text)
  }
  return fallback.map((t, i) => ({
    key: `static-${i}`,
    text: t,
    active: undefined,
  }))
}

export function staleCopy(reason: string | undefined): string | null {
  if (reason === 'superseded') return "Exo's tuning changed since this was last applied."
  if (reason === 'unstamped') return 'Applied, but Exo has no record of which version.'
  return null
}
