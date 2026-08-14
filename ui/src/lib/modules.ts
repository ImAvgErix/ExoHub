import type { ModuleId, ModuleState } from './host'
import amdLogo from '../assets/logos/amd-mark.png'
import braveLogo from '../assets/logos/brave.svg'
import discordLogo from '../assets/logos/discord.svg'
import internetLogo from '../assets/logos/internet.png'
import nvidiaLogo from '../assets/logos/nvidia.png'
import spotifyLogo from '../assets/logos/spotify.svg'
import steamLogo from '../assets/logos/steam.png'
import windowsLogo from '../assets/logos/windows.svg'

/**
 * The eight rows of the shell, in fixed order.
 *
 * One row per optimizer, and every optimizer has a row — there is no module the engine
 * supports that this list omits. Copy here is what Apply actually writes, not a brochure.
 */

export type BrandMark =
  /** Official full-colour brand artwork. */
  | { kind: 'brand'; src: string }
  /** Phosphor glyph, for the rows that are not a brand at all. */
  | { kind: 'symbol'; name: SymbolName }

export type SymbolName = 'windows' | 'network'
export type MarkFit = 'default' | 'wide' | 'tight'

export type ModuleRow = {
  id: ModuleId
  label: string
  mark: BrandMark
  /** Brand colour, or the ink token when the official mark is black (Steam). */
  color: string
  plate: string
  invert: boolean
  fit: MarkFit
  summary: string
  does: string[]
  /** Present only for modules with a real choice; pressing opens the profile sheet. */
  options?: ReadonlyArray<readonly [label: string, hint: string]>
  /** Turns the chosen index into the params host.apply() expects. */
  applyOptions?: (pick: number) => Record<string, unknown>
  /**
   * Why this row can read as not installed, when "<Name> is not installed" would leave the
   * user arguing with the screen. Only needed where the module's scope is narrower than its
   * name suggests.
   */
  missingHint?: string
}

export const MODULES: readonly ModuleRow[] = [
  {
    id: 'nvidia',
    label: 'NVIDIA',
    mark: { kind: 'brand', src: nvidiaLogo },
    color: '#76b900',
    plate: 'linear-gradient(160deg,#8fd400,#3a5c00)',
    invert: true,
    fit: 'default',
    summary: 'Native DRS profiles, latency mode, and verified driver power.',
    does: [
      'Writes the Base DRS pack through NVAPI and re-reads it in a fresh session',
      'Applies per-title profiles Exo can verify — never a guessed exe path',
      'Locks power management to prefer maximum performance',
      'Lets you pick G-SYNC / VRR smoothness or raw-latency sync pins',
      'Snapshots the pre-Exo DRS database so Repair can put it back',
    ],
    options: [
      ['G-SYNC / VRR', 'Cap just under refresh and let the panel sync. Smoothest.'],
      ['Raw latency', 'No cap, no sync. Lowest input lag, some tearing.'],
    ],
    applyOptions: (pick) => ({ useGsync: pick === 0 }),
  },
  {
    id: 'amd',
    label: 'AMD',
    mark: { kind: 'brand', src: amdLogo },
    color: '#ed1c24',
    plate: 'linear-gradient(160deg,#ed1c24,#8b0a10)',
    invert: false,
    fit: 'default',
    summary: 'Chipset package health on Ryzen, or Radeon Software quiet when a Radeon GPU is present.',
    does: [
      'Ryzen + no Radeon: tracks AMD Chipset Software against the newest known package',
      'Applied only when the newest chipset package is installed and PSP/SMBus are healthy',
      'With a Radeon GPU: disables auto-start, updater, and crash-reporter tasks (never deletes them)',
      'With a Radeon GPU: turns off analytics keys that already exist — absent keys stay absent',
      'Repair restores the saved Radeon task and telemetry baseline',
    ],
    missingHint:
      'No AMD hardware found — no Radeon adapter and no Ryzen CPU — so there is nothing here to tune.',
  },
  {
    id: 'system',
    label: 'Windows',
    mark: { kind: 'brand', src: windowsLogo },
    color: '#0078d4',
    plate: 'linear-gradient(145deg,#00a4ef,#0078d4 60%,#005a9e)',
    invert: true,
    fit: 'tight',
    summary: 'An Exo power plan, Game Mode, capture noise, and reversible privacy levers.',
    does: [
      'Builds a named Exo power plan for this CPU — mains only, battery left alone',
      'Turns Hardware-accelerated GPU scheduling on (needs a reboot to go live)',
      'Keeps Game Mode on and Game Bar / Game DVR capture off',
      'Sets MMCSS responsiveness to 10 and network throttling to the OS default',
      'Stops USB devices sleeping mid-game; leaves NTFS last-access and 8.3 names off',
      'Applies advertising ID, telemetry, activity history, and tailored-experience privacy levers',
    ],
  },
  {
    id: 'internet',
    label: 'Internet',
    mark: { kind: 'brand', src: internetLogo },
    color: '#6366f1',
    plate: 'linear-gradient(160deg,#818cf8,#4f46e5 55%,#312e81)',
    invert: false,
    fit: 'default',
    summary: 'NIC offloads and stack prefs after a real path measurement.',
    does: [
      'Measures the current route, then applies a latency or throughput profile',
      'Writes supported adapter offloads by RegistryKeyword — locale-independent',
      'Keeps Ethernet preferred only after a bound internet probe succeeds; Wi-Fi stays available',
      'Picks the fastest healthy public DNS from a live test, with Cloudflare as the offline fallback',
      'Snapshots the exact pre-apply stack so Repair is a restore, not a stock reset',
    ],
    options: [
      ['Lowest latency', 'Strip offloads and coalescing. Best for ranked play.'],
      ['High throughput', 'Keep offloads on. Better for large downloads.'],
    ],
    applyOptions: (pick) => ({ preferLowestLatency: pick === 0 }),
  },
  {
    id: 'steam',
    label: 'Steam',
    mark: { kind: 'brand', src: steamLogo },
    color: '#66c0f4',
    plate: 'linear-gradient(160deg,#2a475e,#0e141b)',
    invert: true,
    fit: 'default',
    summary: 'Overlay cost and launch weight, without thrashing Steam CEF.',
    does: [
      'Injects verified VDF keys at known section paths — never invented at a guessed path',
      'Quiets friends notifications and in-game download contention',
      'Keeps foreground Steam at Normal/High QoS while a game holds focus',
      'Only background webhelpers drop to BelowNormal / EcoQoS, then restore',
      'Does not EmptyWorkingSet, kill, or suspend steamwebhelper',
    ],
  },
  {
    id: 'discord',
    label: 'Discord',
    mark: { kind: 'brand', src: discordLogo },
    color: '#5865f2',
    plate: 'linear-gradient(160deg,#5865f2,#3c45a5)',
    invert: true,
    fit: 'tight',
    summary: 'A lean client path for voice — no forbidden Chromium flags.',
    does: [
      'Applies the compatibility-gated DiscOpt kernel only when the bundled binaries verify',
      'Keeps disable-background-timer-throttling for voice; strips flags that paint while alt-tabbed',
      'Writes Voice QoS DSCP 46 per installed variant',
      'Enforces the Equicord plugin budget on stable — PTB/Canary kernel install stays out',
      'Trims locale packs and spellcheck dictionaries to a deterministic allow list',
    ],
  },
  {
    id: 'spotify',
    label: 'Spotify',
    mark: { kind: 'brand', src: spotifyLogo },
    color: '#1ed760',
    plate: 'linear-gradient(160deg,#1ed760,#0d8a38)',
    invert: true,
    fit: 'tight',
    summary: 'Keep the client off the game GPU and off the login path.',
    does: [
      'Turns hardware acceleration off so Spotify stops compositing on the game GPU',
      'Stops Spotify starting with Windows (prefs + Run key — both, or it comes back)',
      'Requests Very High (320 kbit/s) streaming and download quality',
      'Hides the home-page promo takeover and track-change toasts',
      'Closes the client before writing prefs — a running client would overwrite every change',
    ],
  },
  {
    id: 'brave',
    label: 'Brave',
    mark: { kind: 'brand', src: braveLogo },
    color: '#fb542b',
    plate: 'linear-gradient(160deg,#ff6b3d,#a32a0c)',
    invert: false,
    fit: 'default',
    summary: 'Shields, WebRTC privacy, and idle-tab efficiency — Safe Browsing left on.',
    does: [
      'Requires both Shields ad-blocking and fingerprinting policies before the row reads applied',
      'Leaves Safe Browsing and component updates on; removes older Exo values that turned them off',
      'Disables non-proxied WebRTC UDP and legacy WebRTC TLS',
      'Enables High Efficiency, wake-up throttling, and occlusion for hidden tabs',
      'Defaults notification, location, and sensor prompts off; does not force-install extensions',
    ],
  },
] as const

type StatePresentation = {
  word: string
  /** Word colour; the ink token means "follow --exo-text". */
  color: string
  dot: string
  label: string
  filled: boolean
}

export const STATE_PRESENTATION: Record<ModuleState, StatePresentation> = {
  applied: { word: 'ON', color: 'var(--exo-text)', dot: 'var(--exo-text)', label: 'REAPPLY', filled: false },
  ready: { word: 'READY', color: 'var(--exo-secondary)', dot: 'var(--exo-dot-ready)', label: 'APPLY', filled: true },
  blocked: { word: 'STUCK', color: 'var(--exo-amber)', dot: 'var(--exo-amber)', label: 'RETRY', filled: false },
  missing: { word: 'NOT INSTALLED', color: 'var(--exo-muted)', dot: 'var(--exo-dot-missing)', label: 'NOT INSTALLED', filled: false },
}

export const BLOCKED_REASON =
  'Windows has a restart pending. Exo resumes AMD from the blocked step afterwards.'

export function tooltipFor(row: ModuleRow, state: ModuleState, pick: number): string {
  if (state === 'missing') {
    return row.missingHint ?? `${row.label} is not installed, so there is nothing to apply`
  }
  if (state === 'blocked') return BLOCKED_REASON
  if (row.options) return `Choose a profile, then apply — currently ${row.options[pick]?.[0] ?? row.options[0][0]}`
  const word = STATE_PRESENTATION[state].label
  return `${word.charAt(0)}${word.slice(1).toLowerCase()} ${row.label}`
}

export function moduleById(id: string): ModuleRow | undefined {
  return MODULES.find((row) => row.id === id)
}
