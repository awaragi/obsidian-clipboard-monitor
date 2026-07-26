## Why

The status bar currently shows the target note and content-type scope
(e.g. "Clipboard Monitor: Meeting Notes — Text only") but not which text
format is being applied to inserted content. A user running watch mode
with a non-default format (e.g. "Callout") has no at-a-glance way to
confirm which format is active without reopening the settings modal.

## What Changes

- Add the active `TextFormat`'s name to the status bar text, alongside
  the existing target note and content-type scope, e.g. "Clipboard
  Monitor: Meeting Notes — Text only — Callout".
- Extend `WatchModeStatus` (`src/ts/watchMode/types.ts`) with a
  `formatLabel: string | null` field, set to the format's name while
  running and `null` while stopped (mirroring `targetName`/`scopeLabel`).
- `WatchModeController.start()` passes `format.name` through in the
  `onStatusChange` call; `stop()` passes `null`.
- `main.ts#renderStatus` includes `formatLabel` in the running-state
  status text. No change to the stopped-state text ("Clipboard Monitor:
  off").

## Capabilities

### New Capabilities
- `status-bar-format-label`: the status bar's "Status bar indicator"
  requirement (originally from `watch-mode-core`), extended to also show
  the active text format's name. Expressed as a new capability rather
  than a delta against `watch-mode-core`, since `openspec/specs/` has no
  archived capabilities yet for this project — consistent with how
  `watch-settings-modal` and `images` handled the same situation.

### Modified Capabilities
(none — see above)

## Impact

- Affected code: `src/ts/watchMode/types.ts` (`WatchModeStatus`),
  `src/ts/watchMode/watchModeController.ts` (`start`/`stop`),
  `src/ts/main.ts` (`renderStatus`).
- Test impact: `watchModeController.spec.ts`'s assertions on
  `onStatusChange` calls need the new field.
- No data-shape changes to persisted settings, no new dependencies.
