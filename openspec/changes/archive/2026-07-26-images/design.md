## Context

`watch-mode-core` built the `WatchModeHost` seam and an injectable watcher
factory specifically so later phases could extend behavior without
breaking existing unit tests. `content-type-scope` added a selectable
`"image"` scope value but, per its own design doc, deliberately left it
with no positive effect: "only a new `shouldInsertImage(scope)` is added
[in Phase 5], the gate function [`shouldInsertText`] doesn't change." This
change is that Phase 5: real clipboard image detection, dedupe, scope
gating, and insertion as a vault attachment link, per proposal.md §4.4
and the data-flow diagram in §4.7.

Constraint carried over from every prior phase: no plugin-side image
settings (proposal.md §4.4/§4.6) — attachment folder, filename style, and
link format (wikilink vs. markdown) all come from Obsidian's own Files &
Links settings via the public `FileManager` APIs, the same ones Obsidian's
own paste handler uses.

## Goals / Non-Goals

**Goals:**
- Detect a new image on the clipboard (distinct from the last-seen image)
  during watch mode's existing poll loop, independent of text detection.
- Gate image insertion on the active content-type scope, exactly mirroring
  how `shouldInsertText` already gates text.
- Save the image via `vault.createBinary()`, resolve its path via
  `fileManager.getAvailablePathForAttachment()`, and generate its link via
  `fileManager.generateMarkdownLink()` — then insert that link at the
  target note's stored cursor position via the existing `insertText` seam.
- Attachment filenames look like Obsidian's own manual-paste output
  (`Pasted image <timestamp>.png`), so watch-mode-inserted images are not
  visually distinguishable from hand-pasted ones.

**Non-Goals:**
- No max attachment/clipboard size cap — that's Phase 7 Polish
  (proposal.md §4.6's "Max clipboard content size" setting).
- No floating always-on-top indicator or "✓ inserted" flash — Phase 6.
- No image format conversion or compression — whatever Electron's
  `NativeImage.toPNG()` returns is written to the vault as-is.
- No handling for non-image, non-text clipboard formats (files, HTML,
  RTF) — out of scope per proposal.md's concept (§1: "text and/or
  images").

## Decisions

- **`ClipboardReader.readImage(): Buffer | null`** wraps Electron's
  `clipboard.readImage()` and `NativeImage.isEmpty()`/`.toPNG()`, mirroring
  how `readText()` already wraps `clipboard.readText()`. Returns `null`
  when the clipboard has no image, `Buffer` (PNG bytes) otherwise. Keeps
  `NativeImage` entirely behind the reader seam — nothing downstream
  touches Electron types directly, consistent with `ElectronClipboardReader`
  being the one place that imports `electron`.
- **`ClipboardContent` discriminated union** (`{ type: "text"; text: string
  } | { type: "image"; data: Buffer }`) replaces the current bare `string`
  passed to `ClipboardWatcherCallback`. Chosen over two separate callbacks
  (`onNewText` / `onNewImage`) because the watcher only ever fires one
  event per poll tick (see next decision) — a single callback keeps that
  invariant explicit in the type rather than relying on callers to notice
  only one of two callbacks is ever called per tick.
- **Image takes priority over text within a single poll tick**: `pollOnce()`
  checks `readImage()` first; if it returns non-null and its hash differs
  from the last-seen image hash, it emits the image event and returns
  without checking text that tick. Text is only checked when no image is
  present. Rationale: a single copy action that populates both an image
  format and a text format on the clipboard (e.g. copying an image from a
  browser, which may also set alt text or a URL as plain text) should
  produce exactly one inserted entry, and the image is the more specific,
  more likely intended content. Alternative considered: insert both —
  rejected, because proposal.md's dedupe rule ("identical clipboard
  content is never inserted twice") implies one clipboard change = one
  inserted entry, not one per format.
- **Single unified `lastContent: { type: "text" | "image"; hash: string } |
  null` slot on `ClipboardWatcher`**, not independent per-type hashes.
  Content is "new" when its `(type, hash)` pair differs from
  `lastContent` — so switching from text to an image and back to that
  same text is still detected as new, since the type changed in between.
  Two independent hashes (one per type) were tried first and rejected: a
  shared clipboard timeline has only one "current" entry at a time, so a
  stale per-type hash from before an intervening entry of the other type
  would incorrectly suppress a genuinely new (re-)occurrence — caught by
  a failing unit test for exactly that "text A → image → text A" sequence
  during implementation.
- **`hashBuffer(data: Buffer): string`** added to `hash.ts` alongside the
  existing `hashText`, both thin wrappers over the same `sha256` digest
  call. Kept as two separate single-purpose exports (matching the file's
  existing style) rather than one generic `string | Buffer` overload.
- **`shouldInsertImage(scope): boolean`** = `scope !== "text"`, added next
  to `shouldInsertText` in `contentTypeScope.ts` exactly as
  `content-type-scope/design.md` anticipated — no change to
  `shouldInsertText` or to how scope travels through `start()`.
- **`WatchModeHost.saveImageAttachment(data: Buffer, sourcePath: string):
  Promise<string>`** is the new seam method, implemented in
  `obsidianHost.ts`: generates a filename via a pure
  `generateAttachmentFilename(now: Date = new Date())` helper (format:
  `Pasted image YYYYMMDDHHmmss.png`), resolves the final path with
  `app.fileManager.getAvailablePathForAttachment(filename, sourcePath)`,
  writes it with `app.vault.createBinary(path, arrayBufferFromBuffer(data))`,
  and returns `app.fileManager.generateMarkdownLink(file, sourcePath)`.
  The controller only ever sees the resulting link string — it stays
  ignorant of vault paths, attachment folders, or link-format settings,
  same separation `insertText` already keeps between "what to insert" and
  "how the editor works."
- **`generateAttachmentFilename` is a standalone pure function** (own
  module, own spec) rather than inlined in `obsidianHost.ts`, so it's
  unit-testable with an injected `now` per this project's CLAUDE.md
  time-injection rule — `obsidianHost.ts` itself stays untested thin
  wiring, consistent with it having no `.spec.ts` today.
- **`WatchModeController.handleNewText` is renamed `handleNewContent` and
  becomes `async`**, dispatching on `content.type`. The text branch is
  unchanged logic, just moved under the discriminant. The image branch:
  gates on `shouldInsertImage`, captures the current `target` before
  `await`ing `saveImageAttachment`, and after the await re-checks
  `this.target === capturedTarget` before inserting — guarding against the
  note having closed, been deleted, or been replaced by a new `start()`
  call while the save was in flight. If stale, the link is discarded
  (attachment file itself is not rolled back — see Risks).
- **Buffer→`ArrayBuffer` conversion for `vault.createBinary` happens inside
  `obsidianHost.ts`**, not the controller, keeping the Obsidian-API-shape
  detail (it wants `ArrayBuffer`, `ClipboardReader` deals in `Buffer`) at
  the host boundary rather than leaking into controller or watcher code.

## Risks / Trade-offs

- [Note closes/is deleted while an attachment save is in flight] → the
  save still completes (the file lands in the vault) but the link is not
  inserted, per the stale-target re-check above; the orphaned attachment
  is not cleaned up. Accepted: this mirrors the existing "closing the note
  is a hard stop, no fallback" behavior from `watch-mode-core`, and a save
  typically completes in well under the poll interval, making the race
  rare. Cleanup would require tracking in-flight saves for rollback,
  disproportionate to how rarely this fires.
- [Clipboard entry has both an image and meaningful text (e.g. copying an
  image with alt text)] → only the image is inserted that tick, per the
  priority decision above; the text is not queued or inserted later even
  if the image is filtered out by scope. Mitigated by scope being
  per-activation and documented — a user who wants that text can run watch
  mode scoped to "Text only" instead.
- [Large images slow down the poll tick or bloat the vault] → out of scope
  for this change (Phase 7 will add a size cap); no mitigation here beyond
  what Obsidian's own paste handler already tolerates, since the save path
  is the same public API.

## Migration Plan

Purely additive on top of `content-type-scope` and `text-formats`. No
persisted-data shape changes — images have no settings and no "last used"
state (proposal.md §4.4/§4.6). The `ClipboardWatcherCallback` signature
change is internal-only; nothing in `main.ts`'s persisted `loadData()`/
`saveData()` shape is affected. Rollback is reverting this change's
commits — no data migration to undo.

## Open Questions

None — behavior is fully specified by proposal.md §4.4 (images), §4.7
(data flow: watcher → content-type-scope filter → image branch → vault
save → link insert), and §1 (output must be indistinguishable from a
manual paste).
