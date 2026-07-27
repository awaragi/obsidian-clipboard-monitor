## 1. Cheap image dedupe seam

- [x] 1.1 Extend `ClipboardReader` (`src/ts/clipboard/clipboardReader.ts`) so
      callers can get image dimensions and a raw bitmap without forcing a
      PNG encode — e.g. a method returning `{ width, height, bitmap: Buffer
      } | null` instead of (or alongside) the current PNG-only
      `readImage(): Buffer | null`. Update `ElectronClipboardReader` to use
      `NativeImage.getSize()` / `.toBitmap()` accordingly, and add a
      `clearImage()`/`clear()` method wrapping `electron.clipboard.clear()`
      for later use in section 3.
- [x] 1.2 Update (or add) a hand-written test double for `ClipboardReader`
      to support the new shape, alongside existing fakes used by
      `clipboardWatcher.spec.ts` — no `vi.mock`, per project convention.

## 2. Hashing algorithm swap

- [x] 2.1 In `src/ts/clipboard/hash.ts`, add a non-cryptographic hash
      function for image content (hand-rolled FNV-1a, or
      `crypto.createHash('md5')`/`'sha1'` reusing the existing `crypto`
      import — pick one per design.md's open question) alongside the
      existing `hashText`/`hashBuffer`. Leave `hashText` untouched — text
      hashing is out of scope.
- [x] 2.2 Add/extend `hash.spec.ts` covering the new function: same input
      → same output, different input → different output, and (if a raw
      bitmap-shaped buffer) empty/degenerate buffer doesn't throw.

## 3. Staged dedupe in the watcher

- [x] 3.1 In `src/ts/clipboard/clipboardWatcher.ts`, restructure the image
      branch of `pollOnce()` (and the `start()` priming logic) to: read
      dimensions first; if they differ from the last-seen image's
      dimensions, treat as new without hashing; if they match, hash the raw
      bitmap with the new non-crypto hash and compare. Keep the existing
      "image takes priority over text in the same tick" and "type+hash"
      last-seen model intact — only the image side's cheap-check ordering
      and hash input change.
- [x] 3.2 Move the PNG encode (`toPNG()`/its equivalent) out of the poll
      path entirely — it should only be produced once new image content is
      confirmed, at the point where the caller is about to save it as a
      vault attachment (see section 4). Update `ClipboardContent`'s image
      variant and/or the callback contract as needed so the watcher can
      hand off "confirmed new bitmap" and let the caller encode to PNG
      lazily, rather than the watcher always producing PNG bytes upfront.
- [x] 3.3 Update `clipboardWatcher.spec.ts`: existing scenarios (new image
      detected, identical image not re-inserted, switching back to
      previously-seen text still detected, image-priority-over-text) must
      keep passing against the new dedupe path. Add a scenario for two
      different images at the same dimensions being correctly distinguished
      (dimensions match → falls through to hash → hash differs → new).

## 4. Clear-clipboard-after-insert

- [x] 4.1 Add a `clearClipboardAfterImageInsert` (or similarly named)
      boolean field to the plugin's persisted settings shape in
      `src/ts/main.ts` (`ClipboardMonitorData`), defaulting to `false` for
      new and existing installs.
- [x] 4.2 Wire the new `ClipboardReader` clear method (from 1.1) through
      the `WatchModeHost` seam (`src/ts/watchMode/types.ts` +
      `obsidianHost.ts`) so `WatchModeController` can trigger it without
      importing `obsidian` or `electron` directly.
- [x] 4.3 In `WatchModeController.handleNewContent()`
      (`src/ts/watchMode/watchModeController.ts`), after a successful image
      save + `insertText()` call (i.e. after line ~115's insert, and only
      on that success path — not before, and not if the target went stale
      per the existing in-flight-save check), call the clear-clipboard seam
      method when the setting is enabled. Text insertion path is untouched.
- [x] 4.4 Extend `watchModeController.spec.ts` with scenarios: setting
      enabled + successful image insert → clear is called; setting disabled
      (default) → clear is not called; save fails / target went stale
      before insert → clear is not called; text content inserted → clear is
      never called regardless of the setting.

## 5. Settings UI

- [x] 5.1 Add a toggle to `ClipboardMonitorSettingTab`
      (`src/ts/settings/clipboardMonitorSettingTab.ts`) for "Clear clipboard
      after image insert," off by default, with description text stating
      plainly: (a) it clears the *entire* system clipboard, not just the
      inserted image — any other format present (e.g. accompanying text)
      is also lost; (b) re-copying the same image afterward will be
      treated as new and inserted again.
- [x] 5.2 Wire the toggle's persisted value through `main.ts` the same way
      `lastUsedScope`/`formats` are threaded today (load default on
      install, save on change).

## 6. Verification

- [x] 6.1 Run the full test suite; confirm no regressions in existing
      `images`/`content-type-scope`/`watch-mode-core` behavior.
- [x] 6.2 Manually verify in a real vault: large-image copy/paste still
      inserts correctly and promptly; identical image copied twice in a row
      is still deduped when the new setting is off; toggling the setting on
      and re-copying the same image re-inserts it; a mixed image+text
      clipboard entry with the setting on loses the text too (confirms the
      documented caveat, not a bug).
