## Why

Every poll tick (default 400ms) currently reads the clipboard image, re-encodes
it to PNG (`NativeImage.toPNG()`), and SHA-256-hashes the resulting buffer to
detect change — regardless of whether the clipboard has actually changed since
the last tick. Both the re-encode and the cryptographic hash are unnecessary
work paid on every tick, for the entire lifetime of a watch-mode session, and
the cost scales with image size (proposal.md's original "Performance" phase,
item 7). Separately, a user who intentionally re-copies the exact same image
(e.g. re-running a screenshot tool with an unchanged result) currently has no
way to force re-insertion, since dedupe treats it as unchanged content.

## What Changes

- Restructure image dedupe into a staged, cheaper check: read image
  dimensions first (`getSize()` — free, no encoding involved) and treat a
  dimension mismatch as an immediate "new content" signal without hashing.
  Only when dimensions match the last-seen image does the watcher fall
  through to a content hash.
- When a hash is needed, hash the raw uncompressed bitmap (`toBitmap()`)
  instead of a freshly PNG-encoded buffer, avoiding the PNG compression pass
  on every tick.
- Swap the algorithm used for image content hashing from SHA-256 to a fast
  non-cryptographic hash (hand-rolled or via an existing built-in — no new
  npm dependency). Cryptographic collision-resistance is not needed for
  change detection; only full-byte-coverage determinism is.
- Defer PNG encoding (`toPNG()`) so it happens at most once per genuinely new
  image — right before saving it as a vault attachment — instead of once per
  poll tick.
- Add a new global setting, **"Clear clipboard after image insert"** (off by
  default, images only — does not affect text insertion), that clears the
  system clipboard immediately after a successful image save + insert.
  Settings copy must state plainly that this clears the *entire* system
  clipboard (all formats, not just the inserted image), and that a
  subsequent identical copy will be treated as new content and re-inserted.
- **Explicitly not doing**, with rationale recorded in design.md: a global
  max clipboard/attachment size cap; random-pixel-sampling dedupe with a
  retained in-memory bitmap; an OS-level clipboard change-counter (native
  addon) to avoid polling entirely; any text-side hashing changes.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `images`: image content-change detection changes from
  "hash a freshly PNG-encoded buffer with SHA-256 on every tick" to
  "check dimensions first, hash a raw bitmap with a non-cryptographic hash
  only when dimensions match, and defer PNG encoding until an insertion is
  confirmed." Adds a new requirement: when the "clear clipboard after image
  insert" setting is enabled, the system clipboard is cleared immediately
  after a successful image save + insertion.

## Impact

- `src/ts/clipboard/clipboardReader.ts` — `ClipboardReader` seam needs
  lower-level access (image dimensions, raw bitmap) rather than only a
  PNG buffer, plus a new method to clear the system clipboard.
- `src/ts/clipboard/hash.ts` — image hashing switches to a non-cryptographic
  algorithm; `hashText` is unaffected (text hashing was assessed and is not
  a performance concern).
- `src/ts/clipboard/clipboardWatcher.ts` — dedupe logic restructured to
  stage the dimension check ahead of hashing, and to defer PNG encoding
  until content is confirmed new.
- Image insertion pipeline (`watchModeController.ts` and wherever
  `vault.createBinary()` / `getAvailablePathForAttachment()` /
  `generateMarkdownLink()` are invoked) — hook the clipboard-clear call in
  strictly after a successful save + insert, gated by the new setting.
- Settings tab (`clipboardMonitorSettingTab.ts`) — new toggle plus
  cost/benefit copy for the clear-after-insert setting.
- No new npm dependencies.
