## 1. Logger module

- [x] 1.1 Create `src/ts/logger.ts` with a `Logger` interface (`debug(message: string, ...args: unknown[]): void`, `info(message: string, ...args: unknown[]): void`) and a `createConsoleLogger(isEnabled: () => boolean, prefix?: string)` factory that wraps `console.debug`/`console.info`, checking `isEnabled()` before each call.
- [x] 1.2 Add `src/ts/logger.spec.ts` covering: no console output when `isEnabled()` returns `false`; both methods fire when `isEnabled()` returns `true`; the live check happens per-call (changing what `isEnabled()` returns between calls changes behavior without recreating the logger).

## 2. Settings persistence

- [x] 2.1 In `src/ts/main.ts`, add `debugLoggingEnabled: boolean` to `ClipboardMonitorData`, defaulting to `false` in `loadClipboardMonitorData()`.
- [x] 2.2 Add `persistDebugLoggingEnabled(value: boolean): Promise<void>` in `main.ts`, following the same shape as `persistClearClipboardAfterImageInsert`.
- [x] 2.3 In `src/ts/settings/clipboardMonitorSettingTab.ts`, add `getDebugLoggingEnabled()`/`setDebugLoggingEnabled(value)` to the `FormatListHost` interface, and wire them in `main.ts`'s `formatListHost` object.

## 3. Wire the logger into watch mode

- [x] 3.1 In `main.ts`'s `onload()`, construct one `Logger` via `createConsoleLogger(() => this.data.debugLoggingEnabled)` before constructing `WatchModeController`.
- [x] 3.2 Add a `Logger` constructor parameter to `WatchModeController` (`src/ts/watchMode/watchModeController.ts`); pass it through to the `WatcherFactory` closure so every `ClipboardWatcher` it creates receives the same instance.
- [x] 3.3 Add a `Logger` constructor parameter to `ClipboardWatcher` (`src/ts/clipboard/clipboardWatcher.ts`).
- [x] 3.4 Update `main.ts` to pass the constructed `Logger` into `new WatchModeController(host, ...)`.

## 4. Log call sites

- [x] 4.1 In `ClipboardWatcher.pollOnce()`: `debug`-log the outcome of each tick (no content found / duplicate content skipped / new content detected, with type).
- [x] 4.2 In `ClipboardWatcher.start()`: `debug`-log the primed dedupe state (content found on clipboard at start, if any).
- [x] 4.3 In `WatchModeController.start()`/`stop()`: `info`-log session start (target basename, scope, format name, poll interval ms) and stop (+ reason, including the auto-stop paths in `stopWithNotice`).
- [x] 4.4 In `WatchModeController.handleNewContent()`: `info`-log text/image content detected and inserted, and image attachment saved (path).

## 5. Settings UI

- [x] 5.1 Add a "Debugging" section to `ClipboardMonitorSettingTab.display()` with a single `Setting().addToggle(...)` bound to `getDebugLoggingEnabled`/`setDebugLoggingEnabled`, matching the existing `clearClipboardAfterImageInsert` toggle pattern, including a short explanatory paragraph (what it does, that it's off by default, that it's visible in Obsidian's devtools console).

## 6. Tests for logic-bearing changes

- [x] 6.1 Update `src/ts/clipboard/clipboardWatcher.spec.ts` to pass a fake `Logger` (hand-written fake recording calls, no `vi.mock`) and assert `debug` calls happen at the expected points (new content, duplicate skipped).
- [x] 6.2 Update `src/ts/watchMode/watchModeController.spec.ts` to pass a fake `Logger` and assert `info` calls happen on start/stop/insert/save.

## 7. Verification

- [x] 7.1 Run the full test suite and typecheck; confirm no regressions.
- [x] 7.2 Manually verify in a dev build: toggle "Debug logging" on, start watch mode, copy text/an image, confirm `[Clipboard Monitor]`-prefixed `debug`/`info` entries appear in Obsidian's devtools console and are filterable via the Verbose/Info checkboxes; toggle off mid-session and confirm output stops without restarting watch mode.
