## 1. Combined settings modal

- [x] 1.1 Create `src/ts/watchMode/watchModeSettingsModal.ts` — a
      `WatchModeSettingsModal extends Modal` taking `(app, target:
      WatchModeTarget, formats: TextFormat[], initialScope:
      ContentTypeScope, initialFormatId: string)`. Overrides `open():
      Promise<{ scope: ContentTypeScope; format: TextFormat } |
      undefined>` following the existing resolve-in-`onClose` pattern.
      `onOpen()` renders a read-only target-path info row (`Setting(...)
      .setName("Target").setDesc(target.path)`, no input), two
      `Setting` dropdown rows (content-type scope from
      `CONTENT_TYPE_SCOPE_OPTIONS`, text format from `formats` by name),
      each initialized to the constructor's initial values (falling back
      to `formats[0]` if `initialFormatId` doesn't match any format), plus
      a button row with **Watch** (sets a `confirmed` flag and calls
      `close()`) and **Cancel** (calls `close()` only). `onClose()`
      resolves `confirmed ? { scope, format } : undefined`. Add a class-
      level comment noting this modal is the intended home for future
      per-activation settings.
- [x] 1.3 Style the target row's `descEl` (via CSS on the desc element,
      e.g. `white-space: nowrap; overflow: hidden; text-overflow:
      ellipsis`, plus a `title` attribute set to the full path) so a long
      vault-relative path is visually truncated with an ellipsis instead
      of wrapping or overflowing the modal.
- [x] 1.2 Delete `src/ts/watchMode/contentTypeScopeModal.ts` and
      `src/ts/watchMode/textFormatPickerModal.ts` — no other call sites
      besides `main.ts`.

## 2. Wire into main.ts

- [x] 2.1 Update imports in `src/ts/main.ts`: remove
      `ContentTypeScopeModal`/`TextFormatPickerModal` imports, add
      `WatchModeSettingsModal`.
- [x] 2.2 Rewrite `startWatchModeChooseSettings`: get the active file
      (unchanged guard), `await new WatchModeSettingsModal(this.app,
      file, this.data.formats, this.data.lastUsedScope,
      this.data.lastUsedFormatId).open()`; if the result is undefined,
      return (no state change); otherwise set `this.data.lastUsedScope`/
      `this.data.lastUsedFormatId` from the result, `await
      this.saveData(this.data)`, and call `this.controller.start(file,
      result.scope, result.format)`.

## 3. Verification

- [x] 3.1 Run `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm
      test` and confirm all pass.
- [ ] 3.2 Manually verify in the test vault (`npm run dev:deploy`): run
      "Start watch mode (choose settings)" via the command palette;
      confirm one modal appears showing the active note's name, a scope
      dropdown, and a format dropdown, pre-filled with the last-used
      values; change both dropdowns, click
      **Watch**, and confirm watch mode actually starts (status bar
      reflects the chosen scope, copied text is inserted in the chosen
      format). Re-open the command and click **Cancel**: confirm nothing
      starts and the status bar / last-used values are unchanged. Re-open
      once more and dismiss with Escape: same — no start, no change. Run
      the plain "Start watch mode" fast path afterward and confirm it
      reuses whatever was last confirmed via **Watch**.
