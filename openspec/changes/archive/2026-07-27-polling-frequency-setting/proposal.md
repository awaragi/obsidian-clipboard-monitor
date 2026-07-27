## Why

Clipboard polling currently runs at a single hardcoded interval (400ms) with
no way for users to trade off responsiveness against CPU/battery cost.
Obsidian (via Electron) does not expose a clipboard-change event, so the
plugin must poll — some users will want faster detection, others will prefer
a lighter footprint, and neither is currently configurable.

## What Changes

- Add a "Polling frequency" plugin setting with three label-only options:
  Fast, Moderate, Slow (mapping internally to 500ms, 1s, 2s). No numeric
  values are shown in the UI.
- Default the setting to Moderate.
- Add a description block in the settings tab explaining (a) the
  performance/battery impact of each choice and (b) why polling is used at
  all (Obsidian/Electron does not expose a clipboard-change event, so the
  plugin must poll on an interval).
- The selected frequency SHALL only take effect for watch sessions started
  after the setting is changed. A watch session already running keeps the
  interval it started with until it is stopped and restarted.

## Capabilities

### New Capabilities
- `polling-frequency`: The plugin setting itself — its three label-only
  options, default value, persistence, and the settings-tab description
  block explaining performance impact and the reason for polling.

### Modified Capabilities
- `watch-mode-core`: The "Clipboard polling with hash-based dedupe"
  requirement currently states polling happens "on a fixed interval"
  without specifying where that interval comes from. It changes to specify
  that the interval is the polling-frequency setting's value *at the time
  the watch session starts*, and that it does not change for an
  already-running session even if the setting is changed mid-session.

## Impact

- `src/ts/main.ts`: persist/load the new setting; pass the resolved
  interval into `WatchModeController.start()` (or resolve it at start time
  via a host callback) instead of the fixed constructor default.
- `src/ts/watchMode/watchModeController.ts`: read the poll interval per
  `start()` call rather than fixing it once at construction, so a change to
  the setting doesn't affect an in-progress session.
- `src/ts/settings/clipboardMonitorSettingTab.ts`: new setting control
  (dropdown or similar) plus description text.
- New pure module for the frequency-label ↔ milliseconds mapping (unit
  testable, no Obsidian import).
