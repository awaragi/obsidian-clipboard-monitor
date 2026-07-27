## 1. Polling frequency mapping module

- [x] 1.1 Create `src/ts/watchMode/pollingFrequency.ts`: `PollingFrequency` type (`"fast" | "moderate" | "slow"`), `POLLING_FREQUENCY_OPTIONS` array (`{ value, label }`, labels only — Fast/Moderate/Slow), `DEFAULT_POLLING_FREQUENCY = "moderate"`, and a pure `pollingFrequencyToMs(frequency: PollingFrequency): number` mapping fast→500, moderate→1000, slow→2000. No `obsidian` import.
- [x] 1.2 Add `src/ts/watchMode/pollingFrequency.spec.ts` covering the ms mapping for all three values and the default constant.

## 2. WatchModeController: resolve interval per start()

- [x] 2.1 In `watchModeController.ts`, drop the constructor's `pollIntervalMs` parameter and its `DEFAULT_POLL_INTERVAL_MS` default; change `start()` to accept a `pollIntervalMs: number` argument and pass it through to `createWatcher`/`new ClipboardWatcher(...)` at call time instead of closing over a constructor-time value.
- [x] 2.2 Update `WatcherFactory` type signature if needed so the injected factory in tests can still control timing per-call.
- [x] 2.3 Update `watchModeController.spec.ts`: replace the constructor's `10_000` interval arg with passing the interval to each `start()` call; add a scenario asserting that calling `start()` again with a different interval after `stop()` uses the new interval, and that a change made while running does not retroactively affect the active watcher (covered indirectly by the interval only being read at `start()` — assert via the fake watcher factory recording the interval it was invoked with).

## 3. Plugin settings persistence

- [x] 3.1 In `main.ts`, add `pollingFrequency: PollingFrequency` to `ClipboardMonitorData`, defaulting via `loaded?.pollingFrequency ?? DEFAULT_POLLING_FREQUENCY` in `loadClipboardMonitorData()`.
- [x] 3.2 Add a `persistPollingFrequency(value)` method (mirrors `persistClearClipboardAfterImageInsert`) and thread it through a settings-tab host interface.
- [x] 3.3 Update `startWatchMode()` and `startWatchModeChooseSettings()` to resolve `pollingFrequencyToMs(this.data.pollingFrequency)` fresh at call time and pass it as the new argument to `controller.start(...)`.

## 4. Settings tab UI

- [x] 4.1 Extend `FormatListHost` (or add a small dedicated host interface, whichever keeps `clipboardMonitorSettingTab.ts` cleanest) with `getPollingFrequency()` / `setPollingFrequency(value)`.
- [x] 4.2 In `display()`, add a "Polling frequency" section: a description `<p>` explaining (a) faster = quicker detection, higher CPU/battery cost, slower = lighter, more delay, and (b) Obsidian/Electron has no clipboard-change event so the plugin must poll — followed by a `Setting(...).addDropdown(...)` populated from `POLLING_FREQUENCY_OPTIONS`, wired to `getPollingFrequency`/`setPollingFrequency`.

## 5. Verification

- [x] 5.1 Run the full unit test suite and confirm it passes, including updated `watchModeController.spec.ts` and the new `pollingFrequency.spec.ts`.
- [ ] 5.2 Manually build and load the plugin in Obsidian: confirm the setting appears with only Fast/Moderate/Slow labels (no numbers), defaults to Moderate on a fresh vault, and that changing it mid-session doesn't affect an already-running watch (verify by starting a watch, changing the setting, and confirming behavior only changes after stop/restart).
