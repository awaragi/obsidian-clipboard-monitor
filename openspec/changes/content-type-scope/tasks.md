## 1. Content-type scope type and gate

- [x] 1.1 Create `src/ts/watchMode/contentTypeScope.ts` — exports
      `ContentTypeScope = "text" | "image" | "both"`,
      `DEFAULT_CONTENT_TYPE_SCOPE: ContentTypeScope = "both"`, a
      `CONTENT_TYPE_SCOPE_OPTIONS` list of `{ value, label }` for the
      picker (e.g. "Text only" / "Images only" / "Both"), and the pure
      gate `shouldInsertText(scope: ContentTypeScope): boolean` (`scope
      !== "image"`).
- [x] 1.2 Add `src/ts/watchMode/contentTypeScope.spec.ts` covering
      `shouldInsertText` for all three scope values.

## 2. Wire the gate and scope into WatchModeController

- [x] 2.1 Extend `WatchModeTarget`-adjacent state in
      `watchModeController.ts`: `start(target, scope: ContentTypeScope)`
      stores the active scope for the session.
- [x] 2.2 In `handleNewText`, call `shouldInsertText(this.scope)` before
      `insertText`; skip (no insertion, no cursor move) when it returns
      false.
- [x] 2.3 Extend `WatchModeStatus` (in `watchMode/types.ts`) with
      `scopeLabel: string | null`; `onStatusChange` calls include the
      chosen scope's label when running, `null` when stopped.
- [x] 2.4 Update `watchModeController.spec.ts`: add cases for scope
      `"image"` blocking text insertion, scope `"text"`/`"both"` allowing
      it, and `onStatusChange` receiving the correct `scopeLabel`.

## 3. Persistence and commands

- [x] 3.1 In `main.ts`, define the persisted data shape
      `interface ClipboardMonitorData { lastUsedScope: ContentTypeScope }`
      and load it in `onload` via `this.loadData()`, falling back to
      `DEFAULT_CONTENT_TYPE_SCOPE` when no data exists yet.
- [x] 3.2 Update the "Start watch mode" command to pass the loaded
      `lastUsedScope` to `controller.start(file, scope)`.
- [x] 3.3 Add `src/ts/watchMode/contentTypeScopeModal.ts` — an Obsidian
      `Modal` subclass presenting the three `CONTENT_TYPE_SCOPE_OPTIONS`
      as buttons; resolves a promise with the chosen `ContentTypeScope`,
      or resolves `undefined` if dismissed without a choice.
- [x] 3.4 Add the "Start watch mode (choose settings)" command in
      `main.ts`: reads the active file (same "no active note" guard as
      the fast path), opens the modal, and if a scope was chosen, saves it
      via `this.saveData({ lastUsedScope: scope })` and calls
      `controller.start(file, scope)`. If dismissed, does nothing (no
      watch mode start, no data write).

## 4. Status bar

- [x] 4.1 Update `main.ts#renderStatus` to build the status bar text as
      `"Clipboard Monitor: <target> — <scopeLabel>"` when running, and
      `"Clipboard Monitor: off"` when stopped.

## 5. Verification

- [x] 5.1 Run `npm run build`, `npm run lint`, `npm test` and confirm all
      three pass.
- [ ] 5.2 Manually verify in the test vault (`npm run dev:deploy`): run
      "Start watch mode (choose settings)", pick "Text only", copy text,
      confirm it's inserted; run "Start watch mode (choose settings)"
      again, pick "Images only", copy text, confirm it is now **not**
      inserted; run the plain "Start watch mode" command and confirm it
      reuses "Images only" (status bar reflects it) without prompting.
