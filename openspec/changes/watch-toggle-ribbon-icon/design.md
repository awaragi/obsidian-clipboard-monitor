## Context

Watch mode currently exposes three commands (`start-watch-mode`, `start-watch-mode-choose-settings`, `stop-watch-mode`) but no single hotkey can both start and stop it — a user has to bind two keys and remember which one applies to the current state. There's also no mouse-driven entry point; everything goes through the command palette. `WatchModeController` already exposes `isRunning` (a plain getter, no Obsidian dependency), so toggle logic is a thin wrapper in `main.ts`, not a controller change.

The sibling plugin `obsidian-hotkeys-cheatsheet` (`../obsidian-hotkeys-cheatsheet/src/ts/main.ts` and `settingsTab.ts`) already solved "optional ribbon icon gated by a setting" for a different plugin. Its pattern — a boolean setting checked once in `onload()`, `addRibbonIcon` called conditionally, no attempt to add/remove live — is what this change reuses. That plugin defaults `showRibbonIcon` to `true`; this change matches that default for consistency across the author's plugins.

## Goals / Non-Goals

**Goals:**
- One command (`toggle-watch-mode`) that starts or stops watch mode depending on current state, for single-hotkey binding.
- A ribbon icon that opens the existing "choose settings" modal on click.
- A "Show ribbon icon" setting, default on, that gates the ribbon icon.

**Non-Goals:**
- No change to `WatchModeController`'s public API or start/stop semantics.
- No removal of the existing `start-watch-mode`, `start-watch-mode-choose-settings`, or `stop-watch-mode` commands (kept per explicit product decision).
- No live add/remove of the ribbon icon when the setting changes — it takes effect on the next plugin reload, matching `obsidian-hotkeys-cheatsheet`'s pattern.
- No visual "running" state on the ribbon icon (static icon regardless of watch-mode state) — the status bar remains the sole live status indicator.
- No one-click stop from the ribbon icon; stopping via mouse goes through the modal's existing restart flow or the dedicated `stop-watch-mode` command/hotkey.

## Decisions

**Toggle logic lives in `main.ts`, not `WatchModeController`.** The controller already exposes `isRunning` and `currentTarget`. The toggle command needs to know "start with last-used settings for the active file" (an existing `main.ts` responsibility already implemented as `startWatchMode()`), so the toggle callback is simply:
```
() => this.controller.isRunning ? this.controller.stop() : this.startWatchMode()
```
This keeps `WatchModeController` free of Obsidian-command concerns and avoids duplicating the active-file/last-used-settings resolution that already exists in `startWatchMode()`.

**Ribbon icon always calls `startWatchModeChooseSettings()`, never the toggle.** Considered making the ribbon icon mirror the hotkey toggle, but a mouse click is a deliberate action where opening a picker costs nothing extra, whereas a hotkey favors speed. Reusing `startWatchModeChooseSettings()` also means no new stop-when-running-via-ribbon behavior needs to be designed: if watch mode is running, `WatchModeController.start()` already stops the previous session with reason `"restarting"` when the user confirms new settings in the modal, and cancelling the modal leaves the running session untouched. Zero new controller logic.

**Ribbon icon visibility setting is reload-only, not live.** Obsidian's `addRibbonIcon` returns an `HTMLElement` that could be removed with `.remove()` and re-added, making a live toggle technically possible. This change deliberately does not do that: `obsidian-hotkeys-cheatsheet` ships the simpler reload-only pattern, the setting is not expected to be flipped often, and avoiding a second code path (live add/remove alongside the onload-time conditional) keeps `main.ts` simpler. Revisit only if user feedback asks for it.

**Setting name and storage:** `showRibbonIcon: boolean`, default `true`, persisted in `ClipboardMonitorData` alongside the other plugin settings (`debugLoggingEnabled`, `pollingFrequency`, etc.), following the exact same `loadClipboardMonitorData()` / `persist()` pattern already in `main.ts`.

## Risks / Trade-offs

- **[Risk] Users expect the ribbon icon to reflect running state, since the status bar already does.** → Mitigation: none needed per product decision (explicitly static); if this becomes a common request, a follow-up change can add `is-active` styling without touching this change's scope.
- **[Risk] Setting change requiring a reload to take effect may confuse users who expect instant UI feedback.** → Mitigation: setting description text explicitly states "takes effect after restarting Obsidian," matching how `obsidian-hotkeys-cheatsheet` documents the same constraint (implicitly, via no live update) — this change makes it explicit in the description string instead of leaving it undocumented.
- **[Risk] Four watch-mode commands (start, start-choose-settings, stop, toggle) in the command palette is more than a new user can parse.** → Mitigation: accepted trade-off per explicit product decision to keep all commands available; naming (`toggle-watch-mode` → "Toggle watch mode") keeps intent clear.

## Open Questions

None outstanding — all product decisions (keep old commands, reload-only ribbon toggle, static icon, default-on) were confirmed during exploration.
