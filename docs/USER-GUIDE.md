# Exo — user guide

Exo is a private, reversible Windows optimization suite. Every change it makes
is detected, explained, snapshotted, applied, verified and reversible. If a
tweak cannot be verified it is reported honestly — "no measurable gain" is a
valid verdict.

## The screen

Home is a machine board: live CPU / GPU / memory / disk meters, the current
network path, and all eight optimizers (NVIDIA, AMD, Windows, Internet, Steam,
Discord, Spotify, Brave). A **Next** row points at the first optimizer that
still needs work. Firmware misses Exo can read but not set (XMP/EXPO,
Resizable BAR) appear at the bottom when they are off.

Each optimizer uses these words:

| Word | Meaning |
|------|---------|
| **Ready** | Detected, not yet applied |
| **Applied** | Detected applied. A live read-back is what the host calls VERIFIED; Home still says Applied. |
| **Partial** | Some settings landed, or a route was measured without a verified apply |
| **Missing** | The target app or device is not on this machine — the icon stays grey |
| **Blocked** | A dependency drifted or needs attention; Repair / Retry is the path back |

Open an optimizer to see each setting with its desired value and the evidence
for it. **Apply** runs the module; **Repair** restores the snapshot; **Verify**
forces a fresh detection read. Catalog copy before detect uses faint dots —
green and red only appear after a live read.

## Applying changes

1. Open an optimizer and read what it will change.
2. Press **Apply**. The first elevated module costs one UAC prompt; the rest
   of that session's elevated work stays in one batch.
3. **Stop** cancels a long run without replacing the original result.

A snapshot is written before anything changes. **Repair** restores it.

## Updates

Settings has one **Update** button. It checks GitHub and, when a newer build
exists, downloads and installs it. Progress is a percent on that same button —
there is no separate Check / Install pair. Updates install to
`%LocalAppData%\Exo\app`, keep the previous build as a backup, and restore it
automatically if the new build fails to start.

**Verify all** live-detects every optimizer and writes nothing.

## Privacy

Exo keeps everything local: no account, no telemetry, no network calls beyond
the update check and driver downloads you explicitly start. See
[PRIVACY.md](PRIVACY.md). The privacy levers in the Windows module
(advertising ID, telemetry, activity history, tailored experiences, online
speech, feedback prompts) are applied and restored like any other tweak.
Location and Find My Device stay catalogued only — those consent-store values
are strings, not DWORDs, and Exo does not DWORD-write them.

## Reversibility and safety

- Every tweak is classified: **Safe / Caution / High** risk and
  **Fully reversible / Best effort / Irreversible**. Nothing irreversible is
  ever applied silently.
- HAGS and telemetry changes that need a restart say so before apply.
- No folklore: Exo does not ship fake RAM "boosters", standby-list flushes or
  registry values that guides invented. If there is no evidence for a change,
  it is not in the catalog.

## Troubleshooting

- **A module reads Missing but the app is present**: the kit's detect
  step could not confirm it. Open the module and press **Verify**.
- **SmartScreen on first run**: the local build is unsigned; **More info →
  Run anyway**. Signed builds suppress this.
- **Exo will not start after an update**: the previous build is restored
  automatically; if not, reinstall from GitHub Releases.

## Logs

`%LocalAppData%\Exo\logs` — one file per run, with the exact settings written,
read back, skipped and refused. **View logs** and **Issues** in Settings open
the log folder and the GitHub issue tracker.
