## Context

The plugin currently has no logging anywhere (`grep -r "console\." src/` returns nothing outside test files). Watch-mode logic lives in DI-friendly, unit-tested classes (`ClipboardWatcher`, `WatchModeController`) that take dependencies through their constructors and must not import `obsidian` directly or rely on hidden globals (per project directives). Two existing settings — `clearClipboardAfterImageInsert` and `pollingFrequency` — establish the persistence pattern this change reuses: a field on `ClipboardMonitorData` in `main.ts`, a getter/setter pair on the `FormatListHost` interface, and a `Setting` control in `clipboardMonitorSettingTab.ts`.

`WatchModeController` is constructed once in `onload()` and lives for the plugin's lifetime; `ClipboardWatcher` instances are created fresh per `start()` call via the injected `WatcherFactory`.

## Goals / Non-Goals

**Goals:**
- A single boolean setting (`debugLoggingEnabled`, default `false`) that gates all debug output — no in-between verbosity.
- Two log levels, `debug` and `info`, backed by `console.debug`/`console.info` so entries are filterable via Chrome DevTools' built-in "Verbose"/"Info" console filters in Obsidian's devtools.
- Toggling the setting takes effect immediately on an already-running watch-mode session — no restart of watch mode required.
- The logger is itself a plain, injectable, unit-testable seam — no direct `console.*` calls scattered through `ClipboardWatcher`/`WatchModeController`, and no reading of plugin settings from inside those classes.

**Non-Goals:**
- No `error`/`warn` log tier. Failures that matter to a user already surface via `Notice` (`stopWithNotice`, `getActiveFileOrNotice`); this change does not add new error-handling or try/catch around previously-uncaught paths (e.g. native Electron clipboard calls).
- No per-category or per-level toggle — the setting is a single master switch.
- No log persistence/export (e.g. writing to a file or vault note). Output goes to the devtools console only.
- No changes to `obsidianHost.ts` or `clipboardReader.ts` call sites in this change — logging is scoped to the watcher/controller orchestration layer where the interesting lifecycle and dedupe decisions already happen.

## Decisions

**Logger shape: two methods, live-gated by a closure, not by reconstruction.**
```ts
interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
}
```
A single concrete implementation wraps `console.debug`/`console.info` with a fixed prefix (e.g. `[Clipboard Monitor]`) and checks `isEnabled()` — a function passed in at construction, not a boolean baked in once — before each call. `main.ts` constructs exactly one `Logger` instance in `onload()`, passing `() => this.data.debugLoggingEnabled` as `isEnabled`. Because the check happens per-call rather than at construction time, no object needs to be rebuilt when the setting changes, and an in-flight watch-mode session picks up the new state on its very next log call — satisfying the live-toggle requirement without any additional plumbing (e.g. no need for `WatchModeController` to re-read settings or for the settings tab to reach into a running session).

*Alternative considered:* bake `enabled: boolean` into the logger at construction time, and reconstruct/reassign it in `main.ts` whenever the setting changes. Rejected — it requires the settings tab's `onChange` handler to know about and mutate plugin-held logger state, which the existing `FormatListHost` pattern doesn't do for any other setting (settings are fire-and-forget persisted values, not objects with live listeners), and it reintroduces exactly the kind of mutable-shared-state complexity the closure avoids.

**Where the logger is injected: `ClipboardWatcher` and `WatchModeController` constructors, not a global.**
Both classes already take their dependencies via constructor injection (`ClipboardReader`, `WatchModeHost`, callbacks). The `Logger` is added as another constructor parameter, keeping both classes free of hidden globals and easy to unit test with a fake logger. `WatchModeController` passes the same `Logger` instance through to the `WatcherFactory` closure so every `ClipboardWatcher` it creates shares it.

*Alternative considered:* a module-level singleton logger imported directly (`import { logger } from "./logger"`). Rejected — violates the project's no-hidden-globals rule and makes `ClipboardWatcher`/`WatchModeController` untestable in isolation without a real console.

**Master switch covers `debug` and `info` uniformly — no carve-out.**
Both levels check the same `isEnabled()` closure. There is no scenario where `info` fires while `debug` is off or vice versa; the two levels exist only so a user can filter *after* enabling, using DevTools' own console-level checkboxes, not so the plugin can pre-filter.

**Call-site catalog (implementation detail, informs `tasks.md`):**
- `debug` — `ClipboardWatcher.pollOnce()` per-tick outcome (no content / duplicate skipped / new content detected), dedupe priming in `start()`
- `info` — `WatchModeController.start()`/`stop()` (target, scope, format, poll interval / stop reason), content detected & inserted (text/image), image attachment saved (path)

## Risks / Trade-offs

- **Console noise when enabled.** `debug` fires on every poll tick (500ms–2s interval) while watch mode runs — enabling it during a long session produces a lot of console output. Mitigation: this is opt-in, off by default, and is exactly why `debug` and `info` are separate console methods (a user can filter to "Info" only if `debug` is too noisy) → no plugin-side mitigation needed beyond that.
- **No error visibility in logs.** If a native clipboard/image call throws, this change does not add try/catch to log it — the exception continues to propagate uncaught, same as today. Acceptable per the Non-Goals: user-facing failures are Notice's job, not the debug log's.
- **Prefix string duplicated conceptually across log calls.** Low risk — the console-backed `Logger` implementation applies the prefix once, at the wrapper, not at each call site.

## Migration Plan

Purely additive: new setting defaults to `false`, so behavior for existing users is unchanged until they opt in. No data migration — `loadClipboardMonitorData()` treats a missing `debugLoggingEnabled` field the same as `false` (existing pattern used by `clearClipboardAfterImageInsert`). No rollback concerns beyond a normal revert.
