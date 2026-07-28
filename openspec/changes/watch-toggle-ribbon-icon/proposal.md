## Why

Starting and stopping watch mode currently takes two separate commands (and thus two separate hotkeys) bound to different keys, and there is no mouse-driven way to start watching without opening the command palette. A single toggle hotkey and a ribbon icon shortcut make the most common flow (quick start/stop) a one-key or one-click action, matching the ergonomics users expect from an "always-on" utility plugin like this one.

## What Changes

- Add a new `toggle-watch-mode` command: stops watch mode if running, otherwise starts it with the last-used scope/format for the active file (same behavior as the existing `start-watch-mode` command). Intended to be bound to a single hotkey.
- Existing `start-watch-mode`, `start-watch-mode-choose-settings`, and `stop-watch-mode` commands are unchanged and remain available for users who want dedicated bindings.
- Add a ribbon icon (left sidebar) that opens the "choose settings" modal (`start-watch-mode-choose-settings` flow) when clicked, regardless of whether watch mode is currently running. If watch mode is running, the existing "restarting" behavior in `WatchModeController.start()` applies when the user confirms new settings; cancelling the modal leaves the running session untouched.
- Add a "Show ribbon icon" setting (default: on, matching `obsidian-hotkeys-cheatsheet`'s default) that controls whether the ribbon icon is registered. Takes effect on next plugin reload, not live — consistent with how Obsidian ribbon icons are normally managed.
- Update README.md to document the new toggle command and ribbon icon/setting.

## Capabilities

### New Capabilities
- `ribbon-icon`: A ribbon (left sidebar) icon that opens the watch-mode "choose settings" modal on click, gated by a "Show ribbon icon" setting that defaults to on and takes effect on reload.

### Modified Capabilities
- `watch-mode-core`: Adds a `toggle-watch-mode` command that starts or stops watch mode depending on current state, using last-used settings when starting.

## Impact

- `src/ts/main.ts`: register `toggle-watch-mode` command; conditionally register ribbon icon based on setting; add `showRibbonIcon` to persisted plugin data.
- `src/ts/settings/clipboardMonitorSettingTab.ts`: add "Show ribbon icon" toggle setting.
- `src/ts/i18n/locales/*.json`: add strings for the new command name, ribbon tooltip, and setting label/description.
- `README.md`: document the toggle command and ribbon icon.
- No changes to `WatchModeController` — toggle logic is a thin wrapper around existing `isRunning`/`start`/`stop`.
