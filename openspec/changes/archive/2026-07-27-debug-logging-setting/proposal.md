## Why

There is currently no logging anywhere in the plugin, so diagnosing watch-mode issues (missed clipboard changes, dedupe misfires, insertion failures) relies entirely on reading source or reproducing bugs interactively. A user-toggleable debug log lets a user (or the developer, via a bug report) capture what watch mode actually did, filterable by level in Obsidian's devtools console, without any always-on console noise for normal users.

## What Changes

- Add a `Logger` seam (`debug` and `info` methods only — no `warn`/`error` tier; user-facing failures continue to go through `Notice`, unchanged by this proposal) backed by `console.debug`/`console.info` so entries are filterable via Chrome DevTools' built-in "Verbose"/"Info" console filters.
- Add a single persisted boolean setting, `debugLoggingEnabled` (default `false`), following the same `ClipboardMonitorData` + host-getter/setter pattern as `clearClipboardAfterImageInsert` and `pollingFrequency`.
- The gate is a live, call-time check (closure over the persisted setting), not baked into logger construction — toggling the setting in settings tab takes effect immediately for an already-running watch-mode session, no restart required.
- Off means zero log output, on means every `debug`/`info` call site fires — no intermediate verbosity levels.
- Inject the `Logger` into `ClipboardWatcher` and `WatchModeController` (the pure, unit-tested orchestration layer) and add call sites there:
  - `debug`: per-poll-tick outcomes (no content found / duplicate content skipped / new content detected), dedupe priming on `start()`
  - `info`: watch-mode start (target, scope, format, poll interval) and stop (+ reason), content detected & inserted (text/image), image attachment saved (path)
- Add a "Debugging" section to the settings tab with a single toggle, matching the existing `Setting().addToggle(...)` pattern.

## Capabilities

### New Capabilities
- `debug-logging`: a toggleable, level-filterable debug log for watch-mode's poll/dedupe/insert lifecycle, gated by a single persisted setting with no in-between verbosity.

### Modified Capabilities
(none — this only adds new behavior; no existing requirements change)

## Impact

- `src/ts/main.ts`: `ClipboardMonitorData` gains `debugLoggingEnabled`; load/persist/getter-setter wiring; construct the `Logger` and pass it into `WatchModeController`.
- `src/ts/watchMode/watchModeController.ts`: accept an injected `Logger`, add `info`/`debug` call sites, thread the logger into the `ClipboardWatcher` it creates.
- `src/ts/clipboard/clipboardWatcher.ts`: accept an injected `Logger`, add `debug` call sites in `pollOnce()`/`start()`.
- `src/ts/settings/clipboardMonitorSettingTab.ts`: `FormatListHost` gains `getDebugLoggingEnabled`/`setDebugLoggingEnabled`; new "Debugging" settings section.
- New module (e.g. `src/ts/logger.ts` or similar): `Logger` interface + console-backed implementation, plain/pure/unit-testable.
- Test files: `watchModeController.spec.ts`, `clipboardWatcher.spec.ts` (new/updated) gain a fake `Logger` and assertions where behavior is logic-bearing; new `.spec.ts` for the logger module itself.
