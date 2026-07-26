## Why

`content-type-scope` added a selectable `"image"` scope value, but by its
own design explicitly has no effect on images yet — no image detection or
insertion exists. Per proposal.md §5 (Build Phase 5), the next step is
making clipboard images actually save as vault attachments and insert as
links at the target note's cursor, using Obsidian's own FileManager APIs
so the result is indistinguishable from a normal manual paste (§1, §4.4).

## What Changes

- Extend `ClipboardReader` with `readImage(): Buffer | null` — reads the
  clipboard image via Electron's `clipboard.readImage()`, returning PNG
  bytes, or `null` when the clipboard holds no image. Keeps Electron's
  `NativeImage` type behind the existing reader seam, same as `readText()`
  already does for text.
- Extend `ClipboardWatcher` to poll for image content alongside text, with
  its own independent dedupe hash (identical image content is never
  inserted twice in a row, same rule as text). When both an image and text
  are present on the clipboard in the same poll tick, the image takes
  priority and text is not checked that tick — documented, not
  configurable.
- Add `shouldInsertImage(scope): boolean` to `contentTypeScope.ts` (`scope
  !== "text"`) — the counterpart `content-type-scope/design.md` explicitly
  anticipated adding without touching the existing `shouldInsertText` gate
  or the controller's scope-handling shape.
- Add a `saveImageAttachment(data, sourcePath)` method to the
  `WatchModeHost` seam, implemented in `obsidianHost.ts` using
  `vault.createBinary()`, `fileManager.getAvailablePathForAttachment()`,
  and `fileManager.generateMarkdownLink()` — reading directly from the
  user's existing Files & Links settings, no plugin-side image settings,
  per proposal.md §4.4.
- Generated attachment filenames follow Obsidian's own manual-paste
  convention (`Pasted image <timestamp>.png`) via an injectable-clock pure
  function, so watch-mode-inserted images look identical to hand-pasted
  ones.
- `WatchModeController` now dispatches detected clipboard content by type:
  text keeps its existing formatted-template path; a new image path gates
  on `shouldInsertImage`, saves the attachment, and inserts the generated
  link at the stored cursor position — same `insertText` insertion seam
  already used for text.
- **BREAKING** (internal only, no user-facing migration):
  `ClipboardWatcherCallback` changes from `(text: string) => void` to
  `(content: ClipboardContent) => void`, a `{ type: "text" | "image", ...
  }` discriminated union; `WatchModeController`'s content handler becomes
  async to await the attachment save.

## Capabilities

### New Capabilities
- `images`: clipboard image detection and dedupe, the content-type scope
  gate for images, attachment save + link generation via Obsidian's
  FileManager APIs, and link insertion at the target note's cursor.

### Modified Capabilities
(none — `openspec/specs/` has no archived capabilities yet for this
project; the watcher/controller changes described above build on
`watch-mode-core`, `content-type-scope`, and `text-formats`' in-progress
specs but are expressed here as part of the new `images` capability
rather than as deltas against unarchived bases)

## Impact

- Affected code: `src/ts/clipboard/clipboardReader.ts` (add `readImage`),
  `src/ts/clipboard/clipboardWatcher.ts` (poll images, dual dedupe,
  discriminated callback), `src/ts/clipboard/hash.ts` (add buffer
  hashing), `src/ts/types/electron.d.ts` (declare `NativeImage`,
  `readImage`), `src/ts/watchMode/contentTypeScope.ts` (add
  `shouldInsertImage`), `src/ts/watchMode/types.ts` (extend
  `WatchModeHost` with `saveImageAttachment`), `src/ts/watchMode/
  obsidianHost.ts` (implement it), `src/ts/watchMode/watchModeController.ts`
  (dispatch on content type, async handling).
- No new dependencies; no plugin settings added (proposal.md §4.4/§4.6
  explicitly exclude image settings); no mobile impact (`isDesktopOnly:
  true` unchanged).
- Out of scope for this change: max clipboard/attachment size cap
  (Phase 7 Polish) and the floating always-on-top indicator (Phase 6).
