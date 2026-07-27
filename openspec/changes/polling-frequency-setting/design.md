## Context

`WatchModeController` (`src/ts/watchMode/watchModeController.ts`) currently
takes `pollIntervalMs` as a constructor parameter, defaulted to a module
constant (`DEFAULT_POLL_INTERVAL_MS = 400`) and fixed once in `main.ts` when
the controller is constructed at plugin load. `ClipboardWatcher` takes that
same value and uses it in `setInterval`. There is currently no per-start
override and no persisted setting.

## Goals / Non-Goals

**Goals:**
- Persist a `pollingFrequency` label (`fast` | `moderate` | `slow`) in plugin
  data, defaulting to `moderate`.
- Map that label to a millisecond interval in one small, pure, unit-tested
  module.
- Resolve the interval at the moment a watch session starts, so a setting
  change never affects a session already in progress.
- Add a settings-tab control (dropdown, consistent with other label-only
  choices in this codebase, e.g. content-type-scope) plus a description
  block covering performance impact and the polling rationale.

**Non-Goals:**
- No numeric ms values are ever shown in the UI.
- No live-reconfiguration of a running watcher's interval.
- No change to the dedupe/hash logic or anything else in
  `ClipboardWatcher` beyond how its interval is supplied.

## Decisions

- **Frequency → ms mapping lives in a new pure module**
  (`src/ts/watchMode/pollingFrequency.ts`), mirroring the existing pattern
  for `contentTypeScope.ts` and `textFormat.ts`: an options array with
  `{ value, label }` for the settings UI, a `DEFAULT_POLLING_FREQUENCY`
  constant, and a `pollingFrequencyToMs()` pure function. This keeps the
  mapping unit-testable and keeps `obsidian` out of core logic per project
  architecture rules.

- **Interval resolved per-`start()`, not at construction** — `WatchModeController`
  currently accepts `pollIntervalMs` once at construction and closes over it
  in its `createWatcher` factory default. To satisfy "only applies to new
  watches," `start()` needs to accept the frequency (or resolved ms) as an
  argument, same as it already does for `scope` and `format`, and pass it
  into `createWatcher` at call time. The constructor's `pollIntervalMs`
  default is dropped in favor of a value passed by the caller on every
  `start()`.
  - Alternative considered: keep interval fixed at construction and have
    `main.ts` reconstruct `WatchModeController` when the setting changes.
    Rejected — it would need to special-case "don't reconstruct while
    running," duplicating logic that `start()` already naturally provides
    (each `start()` call already reads current scope/format from `main.ts`'s
    persisted data), and it complicates `WatchModeController`'s lifecycle
    for no benefit.

- **`main.ts` reads the setting fresh on every `startWatchMode()` /
  `startWatchModeChooseSettings()` call**, same as it already does for
  `lastUsedScope` and the active format, and passes the resolved ms value
  into `controller.start(...)`. This is what naturally gives "only new
  watches are affected" — a running session's `ClipboardWatcher` already has
  its `intervalId` set from the ms value captured at its own `start()` call.

- **Settings UI**: a `Setting(...).addDropdown(...)` in
  `ClipboardMonitorSettingTab`, options built from
  `POLLING_FREQUENCY_OPTIONS` (labels only, no ms in the option text), plus
  a `containerEl.createEl("p", ...)` description block above it explaining:
  (a) faster polling means quicker clipboard-change detection at the cost of
  more CPU/battery use, and slower polling is lighter but has more delay;
  (b) Obsidian/Electron does not expose a clipboard-change event, so the
  plugin has no choice but to poll on an interval.

## Risks / Trade-offs

- [Risk] A user changes the setting mid-session and is confused it didn't
  take effect immediately → Mitigation: this is explicit, intended behavior
  per the proposal; the description block plus consistent behavior (compare
  to `scope`/`format`, which also only apply to the *next* `start()`) keeps
  it predictable rather than surprising.
- [Risk] Widening `WatchModeController.start()`'s signature again (after
  already adding `scope`, `format`, `clearClipboardAfterImageInsert`) grows
  its parameter list → Mitigation: out of scope to refactor into an options
  object here; the existing positional-parameter style is left as-is for
  consistency with the rest of the method's current tasks.
