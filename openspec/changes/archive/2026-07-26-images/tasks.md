## 1. Clipboard image reading

- [x] 1.1 Extend `src/ts/types/electron.d.ts`: declare a minimal
      `NativeImage` interface (`isEmpty(): boolean`, `toPNG(): Buffer`) and
      add `readImage(): NativeImage` to the `Clipboard` interface.
- [x] 1.2 Extend `src/ts/clipboard/clipboardReader.ts`: add `readImage():
      Buffer | null` to the `ClipboardReader` interface and implement it
      in `ElectronClipboardReader` — call `clipboard.readImage()`, return
      `null` if `.isEmpty()`, else `.toPNG()`.
- [x] 1.3 Add `hashBuffer(data: Buffer): string` to `src/ts/clipboard/
      hash.ts`, alongside the existing `hashText`, using the same sha256
      digest.
- [x] 1.4 Add a case to `src/ts/clipboard/hash.spec.ts` (or create it if it
      doesn't exist) covering `hashBuffer`: same input produces the same
      hash, different input produces a different hash.

## 2. Watcher: dual detection with image priority

- [x] 2.1 In `src/ts/clipboard/clipboardWatcher.ts`, add a
      `ClipboardContent` discriminated union (`{ type: "text"; text:
      string } | { type: "image"; data: Buffer }`) and change
      `ClipboardWatcherCallback` to `(content: ClipboardContent) => void`.
- [x] 2.2 Replace the single `lastHash` field with a unified
      `lastContent: { type: "text" | "image"; hash: string } | null` slot
      (an independent per-type hash pair was tried first and rejected —
      it let identical text re-occurring after an intervening image go
      undetected, since its stale hash never invalidated). Update
      `pollOnce()`: check `reader.readImage()` first — if non-null and its
      `(type, hash)` differs from `lastContent`, update `lastContent` and
      emit `{ type: "image", data }`, then return without checking text
      this tick; otherwise fall through to the existing text check against
      the same `lastContent` slot.
- [x] 2.3 Update `start()`'s dedupe-priming logic to prime `lastContent`
      from whatever is already on the clipboard (image takes priority,
      same as `pollOnce()`), so starting watch mode doesn't immediately
      re-insert stale content of either type.
- [x] 2.4 Update `src/ts/clipboard/clipboardWatcher.spec.ts`: adapt
      existing text-only test cases to the new callback shape, and add
      cases for: new image detected and emitted; identical image not
      re-emitted on a later tick; image present alongside new text emits
      only the image event; switching from an image back to
      previously-seen text still emits a text event; start() priming skips
      an already-present image on the first tick.

## 3. Content-type scope gate for images

- [x] 3.1 Add `shouldInsertImage(scope: ContentTypeScope): boolean` to
      `src/ts/watchMode/contentTypeScope.ts` (`scope !== "text"`),
      alongside the existing `shouldInsertText`.
- [x] 3.2 Add cases to `src/ts/watchMode/contentTypeScope.spec.ts`
      covering `shouldInsertImage` for all three scope values.

## 4. Attachment filename and host seam

- [x] 4.1 Create `src/ts/watchMode/attachmentFilename.ts` — exports
      `generateAttachmentFilename(now: Date = new Date()): string`,
      returning `Pasted image <YYYYMMDDHHmmss>.png` (zero-padded, matching
      Obsidian's own manual-paste filename convention).
- [x] 4.2 Add `src/ts/watchMode/attachmentFilename.spec.ts` covering:
      filename format at a fixed injected `now`, and zero-padding for
      single-digit month/day/hour/minute/second values.
- [x] 4.3 Extend `WatchModeHost` in `src/ts/watchMode/types.ts` with
      `saveImageAttachment(data: Buffer, sourcePath: string):
      Promise<string>`.
- [x] 4.4 Implement `saveImageAttachment` in `src/ts/watchMode/
      obsidianHost.ts`: generate a filename via
      `generateAttachmentFilename()`, resolve the path with
      `app.fileManager.getAvailablePathForAttachment(filename,
      sourcePath)`, convert the `Buffer` to an `ArrayBuffer`, write it with
      `app.vault.createBinary(path, arrayBuffer)`, and return
      `app.fileManager.generateMarkdownLink(file, sourcePath)`.

## 5. Wire image content into WatchModeController

- [x] 5.1 In `src/ts/watchMode/watchModeController.ts`, rename
      `handleNewText` to `handleNewContent`, make it `async`, and take a
      `ClipboardContent` parameter. Move the existing text logic (scope
      gate, `renderFormat`, `insertText`) under a `content.type === "text"`
      branch, unchanged otherwise.
- [x] 5.2 Add the image branch: return early if `shouldInsertImage(this
      .scope)` is false; otherwise capture `const target = this.target`,
      `await this.host.saveImageAttachment(content.data, target.path)`,
      then re-check `this.target === target` before calling `insertText`
      with the returned link plus a trailing newline — discard the result
      (no insertion) if the target changed during the await.
- [x] 5.3 Update the watcher-factory callback in the constructor from `(text)
      => this.handleNewText(text)` to `(content) =>
      this.handleNewContent(content)`.
- [x] 5.4 Update `src/ts/watchMode/watchModeController.spec.ts`: adapt the
      fake host/watcher to the new `ClipboardContent` callback shape, and
      add cases for: image insertion under scope `"both"`/`"image"`;
      image blocked under scope `"text"`; link + trailing newline inserted
      at the cursor; no insertion when the target changes (or `stop()` is
      called) while `saveImageAttachment` is still pending (use a
      controllable/deferred fake promise from the fake host).

## 6. Verification

- [x] 6.1 Run `npm run build`, `npm run lint`, `npm test` and confirm all
      three pass.
- [ ] 6.2 Manually verify in the test vault (`npm run dev:deploy`): run
      "Start watch mode (choose settings)", pick "Images only", copy an
      image (e.g. a screenshot), confirm it's saved as an attachment in
      the configured attachment folder and a link appears at the cursor
      matching a normal manual paste; copy the same image again and
      confirm it is not re-inserted; switch scope to "Text only" and
      confirm a subsequently copied image is not inserted; with scope
      "Both", copy text then an image then the same text again and confirm
      all three insert correctly in order.
