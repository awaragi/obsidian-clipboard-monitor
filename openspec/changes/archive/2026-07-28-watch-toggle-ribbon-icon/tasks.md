## 1. Settings data

- [x] 1.1 Add `showRibbonIcon: boolean` to `ClipboardMonitorData` in `src/ts/main.ts`
- [x] 1.2 Default `showRibbonIcon` to `true` in `loadClipboardMonitorData()`
- [x] 1.3 Add `getShowRibbonIcon`/`setShowRibbonIcon` to `FormatListHost` (or equivalent settings host interface) in `src/ts/settings/clipboardMonitorSettingTab.ts`

## 2. Toggle command

- [x] 2.1 Add `toggle-watch-mode` command in `src/ts/main.ts`, callback: stop if `this.controller.isRunning`, else `this.startWatchMode()`
- [x] 2.2 Add `command.toggle_watch` key to all locale files (`en`, `fr`, `es`, `ar`)

## 3. Ribbon icon

- [x] 3.1 In `onload()`, conditionally call `this.addRibbonIcon(...)` when `this.data.showRibbonIcon` is true, with callback `() => this.startWatchModeChooseSettings()`
- [x] 3.2 Add `ribbon.tooltip` translation key (icon tooltip text) to all locale files
- [x] 3.3 Choose and set an appropriate Obsidian icon id (e.g. `clipboard-list` or similar clipboard/watch-themed icon) — used `clipboard-check`

## 4. Settings tab UI

- [x] 4.1 Add a "Show ribbon icon" toggle setting to `ClipboardMonitorSettingTab.display()`, wired to the new host getter/setter
- [x] 4.2 Add `settings.ribbon.label` and `settings.ribbon.desc` translation keys to all locale files; description text SHALL note the change takes effect after reloading the plugin

## 5. Tests

- [x] 5.1 Add/extend unit tests covering toggle behavior — no new test added: the toggle callback in `main.ts` is thin wiring (`isRunning ? stop() : startWatchMode()`) with no logic of its own, dispatching to `WatchModeController.isRunning`/`stop`/`start`, which are already covered by `watchModeController.spec.ts`. Consistent with CLAUDE.md's "thin UI wiring with no logic of its own" carve-out.
- [x] 5.2 Run `npm test` (or project's test command) and confirm all existing and new tests pass — 298/298 pass, including `i18n.spec.ts` locale-completeness checks

## 6. Documentation

- [x] 6.1 Update `README.md`: document the "Toggle watch mode" command and its intended single-hotkey use
- [x] 6.2 Update `README.md`: document the ribbon icon and the "Show ribbon icon" setting (default on, takes effect on reload)

## 7. Verification

- [x] 7.1 Run the full test suite and linter/typecheck — `npm test`, `npm run typecheck`, `npm run lint` all clean
- [ ] 7.2 Manually verify in a dev vault: toggle command starts/stops watch mode; ribbon icon opens the settings modal in both running and stopped states; disabling the ribbon setting hides the icon after reload
