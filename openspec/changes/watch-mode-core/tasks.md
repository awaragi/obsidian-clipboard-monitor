## 1. Clipboard watcher

- [x] 1.1 Create `src/ts/clipboard/clipboardWatcher.ts` — polls a
      `ClipboardReader` every 400ms via `setInterval`, hashes the read
      text with `crypto.createHash("sha256")` (`src/ts/clipboard/hash.ts`),
      and calls back only when the hash differs from the last-seen hash.
      *(Moved from the originally planned `src/ts/watcher/` into
      `src/ts/clipboard/` alongside the reader and hash helper it depends
      on — one cohesive module instead of splitting a 3-file unit across
      two folders.)*
- [x] 1.2 Ignore empty clipboard reads (no callback, no error). Simplified
      from the original plan to also check `availableFormats()`: Electron's
      `clipboard.readText()` already returns `""` when the clipboard holds
      only an image, so the empty-string check alone satisfies "ignore
      images" with no extra API surface or dependency to test against.
- [x] 1.3 Add `src/ts/clipboard/clipboardWatcher.spec.ts` — unit tests for
      hash-based dedupe (new text detected once, repeated identical text
      ignored, second distinct entry detected, empty/image clipboard
      ignored, start()-primes-dedupe, stop()-resets-dedupe) using a fake
      `ClipboardReader`, no real Electron or timers.
- [x] 1.4 Add `src/ts/clipboard/hash.spec.ts` for the small pure hashing
      helper (same input → same hash, different input → different hash,
      empty string doesn't throw).

## 2. Watch mode state and lifecycle

- [x] 2.1 Create `src/ts/watchMode/watchModeController.ts` holding: is-
      running flag, pinned `WatchModeTarget` (`{ path, basename }`), and
      the registered watcher/event handles needed for teardown. Depends
      only on a `WatchModeHost` interface (`src/ts/watchMode/types.ts`) —
      semantic operations (`findMarkdownLeafForPath`, `onLayoutChange`,
      `onFileDeleted`, `onFileRenamed`, `notice`, `onStatusChange`) rather
      than raw Obsidian `App`/`Workspace`/`Vault` types — so the
      controller can be unit-tested with a fake host and no real Obsidian
      runtime. The clipboard watcher itself is also injected via a
      `createWatcher` factory (default: real `ClipboardWatcher`), so tests
      can trigger "new clipboard text" deterministically without timers.
- [x] 2.2 Implement `start(target)`: sets target, creates+starts the
      watcher, registers the stop-detection listeners (section 4), calls
      `host.onStatusChange` (section 5). Starting while already running
      stops the previous session first.
- [x] 2.3 Implement `stop()`: stops the watcher, unregisters listeners,
      clears target, calls `host.onStatusChange({ running: false, ... })`;
      safe to call when already stopped (no-op, no throw).

## 3. Commands and cursor insertion

- [x] 3.1 Register "Start watch mode" command in `main.ts`: reads
      `workspace.getActiveFile()`; if none (or not a `TFile`), shows a
      `Notice` and does not start; otherwise calls
      `watchModeController.start(file)`.
- [x] 3.2 Register "Stop watch mode" command in `main.ts` calling
      `watchModeController.stop()`.
- [x] 3.3 Create `src/ts/watchMode/insertText.ts` (pure: given an
      `EditorLike` and text, reads `getCursor()`, calls `replaceRange`,
      computes the end position via `src/ts/watchMode/advancePosition.ts`,
      calls `setCursor`) plus `obsidianHost.ts#findMarkdownLeafForPath`
      (given a path, scans `workspace.getLeavesOfType("markdown")` for a
      matching `MarkdownView.file.path`, returns its editor or
      `undefined`). *(Split the originally planned single
      `insertAtTarget.ts` into a pure text-insertion function and a
      separate leaf-lookup function on the host adapter, so the cursor-math
      logic is testable in complete isolation from any leaf/workspace
      concept.)*
- [x] 3.4 Wire the `ClipboardWatcher`'s new-text callback to
      `host.findMarkdownLeafForPath` + `insertText` inside
      `WatchModeController`'s private `handleNewText`.
- [x] 3.5 Add `src/ts/watchMode/advancePosition.spec.ts` (single-line
      advances `ch`; empty text is a no-op; multi-line moves to a new line
      and resets `ch`; two advances chain correctly) and
      `src/ts/watchMode/insertText.spec.ts` (inserts at current cursor;
      moves cursor past inserted text; two consecutive insertions chain
      instead of overwriting) using a fake `EditorLike`.

## 4. Automatic stop detection

- [x] 4.1 `WatchModeController.start` registers
      `host.onLayoutChange(...)`: if the target file is no longer open in
      any markdown leaf, stops with a `Notice` ("... — note closed").
- [x] 4.2 Registers `host.onFileDeleted(...)`: if the deleted path matches
      the target, stops with a `Notice` ("... — note deleted").
- [x] 4.3 Registers `host.onFileRenamed(...)`: if the renamed file's old
      path matches the target, stops with a `Notice` ("... — note moved").
- [x] 4.4 All three listeners are unregistered in `stop()` (via
      `host.offWorkspace`/`host.offVault`), and `main.ts#onunload` calls
      `controller.stop()`, so nothing leaks across start/stop cycles or
      plugin reloads. Covered by `watchModeController.spec.ts` (asserts
      `offWorkspace`/`offVault` call counts, and that unrelated
      delete/rename events are ignored).

## 5. Status bar indicator

- [x] 5.1 Add a status bar item via `plugin.addStatusBarItem()` in
      `main.ts`, created once at `onload`.
- [x] 5.2 `main.ts#renderStatus` sets its text to `"Clipboard Monitor:
      <target note name>"` when running, `"Clipboard Monitor: off"` when
      stopped, driven by `WatchModeController`'s `onStatusChange`
      callback.

## 6. Integration and verification

- [x] 6.1 Wire `WatchModeController` into `main.ts` `onload` (constructed
      via `createObsidianHost`) and `onunload` (`controller.stop()`).
- [x] 6.2 `npm run build`, `npm run lint`, `npm test` all pass (27 unit
      tests across 5 spec files: hash, clipboardWatcher, advancePosition,
      insertText, watchModeController).
- [x] 6.3 Manually verified in the test vault: user confirmed watch mode
      inserts new clipboard content automatically and dedupe works
      (repeated copies don't double-insert).

## 7. Follow-up from manual verification

- [x] 7.1 User feedback: consecutive inserted entries ran together on the
      same line with no separator. Added a trailing newline in
      `WatchModeController.handleNewText` (call-site decision, not inside
      `insertText`, so Phase 4's format templates can replace just that
      one spot later). Covered by two new/updated tests in
      `watchModeController.spec.ts` ("inserts newly detected clipboard
      text followed by a newline", "lands consecutive entries on their
      own line, not run together").
- [x] 7.2 Re-ran `npm run build`, `npm run lint`, `npm test` after the
      change — all pass.
- [x] 7.3 Re-deployed via `npm run dev:deploy` — confirmed by user
      (proceeded to next phase without further issues raised).
