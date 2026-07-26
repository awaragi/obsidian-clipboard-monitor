## 1. Text format type, defaults, and render function

- [x] 1.1 Create `src/ts/watchMode/textFormat.ts` — exports the
      `TextFormat = { id: string, name: string, template: string }`
      type, `DEFAULT_TEXT_FORMATS: TextFormat[]` (Raw, Bullet,
      Timestamped `**{{time}}** — {{content}}`, Callout, each with a
      fresh `crypto.randomUUID()` id), a `createDefaultTextFormats()`
      helper that returns a fresh deep copy with new ids (used by both
      first-install seeding and "Reset to defaults"), and the pure
      `renderFormat(template: string, content: string, now: Date = new
      Date()): string` function substituting `{{content}}` and
      `{{time}}` (24-hour `HH:MM`).
- [x] 1.2 Add `src/ts/watchMode/textFormat.spec.ts` covering
      `renderFormat` for: `{{content}}` substitution, `{{time}}`
      substitution at a fixed injected `now`, a template using both
      tokens, and a template with no `{{content}}` token (content is
      simply absent from the output). Also cover
      `createDefaultTextFormats()` returning 4 formats with distinct
      ids across two calls.

## 2. Wire the active format into WatchModeController

- [x] 2.1 Extend `start()` in `watchModeController.ts`: `start(target,
      scope: ContentTypeScope, format: TextFormat)` stores the active
      format for the session, alongside the existing scope.
- [x] 2.2 In `handleNewText`, replace the hardcoded `` `${text}\n` ``
      body with `` `${renderFormat(this.format.template, text)}\n` ``
      — the trailing newline is appended once, after the rendered
      template, not baked into individual templates.
- [x] 2.3 Update `watchModeController.spec.ts`: pass a format (e.g. Raw)
      to every existing `start()` call site, add cases asserting the
      Bullet format's template is applied to inserted text, and that
      consecutive entries under a non-Raw format still land on separate
      lines (one trailing newline per entry, template content
      preserved).

## 3. Format list management

- [x] 3.1 Create `src/ts/settings/formatListOps.ts` — pure, DOM-free
      functions operating on a `TextFormat[]`: `addFormat(formats, name,
      template): TextFormat[]`, `updateFormat(formats, id, changes):
      TextFormat[]`, `deleteFormat(formats, id): TextFormat[]` (no-op,
      returns the input unchanged, when `formats.length === 1`),
      `moveFormat(formats, id, direction: "up" | "down"): TextFormat[]`,
      and `resetToDefaults(): TextFormat[]` (returns
      `createDefaultTextFormats()`). All return new arrays; none mutate
      their input. Keeping list logic here (separate from the settings
      tab's DOM rendering) is what makes it unit-testable without
      constructing Obsidian's `Setting`/DOM APIs.
- [x] 3.2 Add `src/ts/settings/formatListOps.spec.ts` covering: add
      appends a new format with a generated id; update changes only the
      targeted format; delete removes the targeted format; delete is a
      no-op when exactly one format remains; move up/down reorders
      adjacent entries and is a no-op at the respective boundary
      (moving the first entry up, or the last entry down); reset returns
      exactly the 4 defaults.
- [x] 3.3 Create `src/ts/settings/clipboardMonitorSettingTab.ts` — a
      `PluginSettingTab` subclass that renders `plugin.data.formats` as
      a list (name + multi-line template field per row, up/down and
      delete buttons per row, delete disabled when only one format
      remains), an "Add format" control, and a "Reset to defaults"
      button. Every mutation calls the corresponding `formatListOps`
      function, writes the result back to `plugin.data.formats` and
      `plugin.lastUsedFormatId` (via the fallback rule in 4.1 if the
      last-used format was just deleted), calls
      `this.plugin.saveData(this.plugin.data)`, and re-renders (`this
      .display()`).

## 4. Persistence and commands

- [x] 4.1 In `main.ts`, extend `ClipboardMonitorData` to `{
      lastUsedScope: ContentTypeScope, formats: TextFormat[],
      lastUsedFormatId: string }`. In `onload`, after loading data: if
      `formats` is missing or empty, seed it with
      `createDefaultTextFormats()`; if `lastUsedFormatId` doesn't match
      any format's `id` in the (possibly just-seeded) list, fall back to
      `formats[0].id`. Keep the loaded/seeded data on `this.data` as a
      single instance field (replacing the standalone `lastUsedScope`
      field) so the settings tab and command handlers share one source
      of truth.
- [x] 4.2 Register the settings tab: `this.addSettingTab(new
      ClipboardMonitorSettingTab(this.app, this))` in `onload`.
- [x] 4.3 Update the "Start watch mode" command to resolve the active
      format from `this.data.formats` by `this.data.lastUsedFormatId`
      and pass it to `controller.start(file, scope, format)`.
- [x] 4.4 Add `src/ts/watchMode/textFormatPickerModal.ts` — a
      `FuzzySuggestModal<TextFormat>` subclass listing the current
      `formats` by name; resolves a promise with the chosen
      `TextFormat`, or `undefined` if dismissed without a choice
      (resolved from `onClose`, per design.md, so the promise always
      settles).
- [x] 4.5 Update "Start watch mode (choose settings)" in `main.ts`: after
      the existing scope prompt, also `await` a
      `TextFormatPickerModal(this.app, this.data.formats).open()`; if no
      format was chosen, do nothing (no watch mode start, no data
      write — same as the existing scope-dismissal behavior); otherwise
      set `this.data.lastUsedFormatId`, `saveData(this.data)`, and call
      `controller.start(file, scope, format)`.

## 5. Verification

- [x] 5.1 Run `npm run build`, `npm run lint`, `npm test` and confirm all
      three pass.
- [x] 5.2 Manually verify in the test vault (`npm run dev:deploy`): open
      Settings → Clipboard Monitor, add a custom format (e.g. `TODO:
      {{content}}`), confirm it appears in "Start watch mode (choose
      settings)"'s format picker; select it, copy text, confirm the
      rendered template is inserted; run "Start watch mode" again and
      confirm it reuses that format without prompting; delete formats
      down to one and confirm the delete button disables; "Reset to
      defaults" and confirm the four shipped formats return.
