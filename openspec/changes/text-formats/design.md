## Context

`watch-mode-core` currently inserts clipboard text via a hardcoded body
(`` `${text}\n` ``) in `WatchModeController.handleNewText`, with a comment
flagging it as a placeholder ("revisit once Phase 4's format templates
replace this with a user-selected `{{content}}` template"). This change
implements that replacement.

`content-type-scope` established two patterns this design reuses:
- Per-activation choices travel through `WatchModeController.start()` as
  explicit parameters (`scope`), not mutators — same treatment applies to
  `format`.
- Persisted data lives in `main.ts` as a single `ClipboardMonitorData`
  object grown incrementally (`content-type-scope/design.md` explicitly
  anticipated this: "Phase 4 extends it with additional keys rather than
  replacing it").

This change also introduces the project's first `PluginSettingTab` —
no Settings tab exists yet. Per proposal.md §4.6, poll interval, max
clipboard size, and the floating-indicator toggle are *not* part of this
change (Phases 6–7); only the managed text-format list is added to the
tab now.

## Goals / Non-Goals

**Goals:**
- Replace the hardcoded insertion body with a `renderFormat(template,
  content, now)` pure function applied to the active format's template.
- A Settings tab lets users add/edit/delete/reorder text formats and
  reset to the shipped defaults.
- "Start watch mode (choose settings)" prompts for a format in addition
  to the existing scope prompt; "Start watch mode" reuses the last-used
  format.
- Consecutive clipboard entries still land on separate lines regardless
  of which format is active (preserves `watch-mode-core`'s tested
  behavior).

**Non-Goals:**
- No poll interval / max clipboard size / floating-indicator settings —
  those are Phases 6 and 7.
- No template validation or linting (e.g. warning when `{{content}}` is
  missing) — templates are free text; an empty substitution is a user
  authoring mistake, not a state the plugin needs to guard against.
- No drag-and-drop reordering — up/down move buttons are sufficient and
  far simpler to implement and test.
- No import/export of format lists, no per-note format overrides beyond
  the existing per-activation choice.

## Decisions

- **`TextFormat = { id: string, name: string, template: string }`**,
  `id` generated via `crypto.randomUUID()` at creation time (including
  when defaults are first seeded). Stable IDs let `lastUsedFormatId`
  survive renames and reordering without breaking the reference; a
  plain array index would not survive reordering or deletion.
- **`renderFormat(template: string, content: string, now: Date = new
  Date()): string`** replaces two tokens: `{{content}}` with the copied
  text, and `{{time}}` with `now` formatted as 24-hour `HH:MM`. Kept as a
  pure, injectable-clock function (default param, not a hard `new
  Date()` call inside) specifically so it's unit-testable without faking
  global time. Revises proposal.md §4.3's illustrative `**HH:MM** —
  {{content}}` into a concrete token, `**{{time}}** — {{content}}`, for
  the shipped Timestamped default — "HH:MM" in the proposal was
  describing the rendered *output*, not template syntax.
- **The trailing newline moves from the controller into a wrapper
  around `renderFormat`, not into every template**: `insertText(editor,
  renderFormat(format.template, text) + "\n")`. Templates themselves
  (e.g. Callout's `> [!note]\n> {{content}}`) may contain internal
  newlines, but the controller still appends exactly one trailing
  newline after the whole rendered block, so consecutive entries always
  land on separate lines — matching the already-tested "lands
  consecutive entries on their own line" behavior from
  `watch-mode-core`. Alternative considered: bake a trailing `\n` into
  each default template — rejected because user-added templates would
  each have to remember to do the same, an easy-to-forget footgun.
- **Format travels with `start()`, exactly like scope**:
  `WatchModeController.start(target, scope, format: TextFormat)`. No
  `setFormat()` mid-session mutator, for the same reason
  `content-type-scope/design.md` gave for scope: proposal.md never
  describes changing it mid-session.
- **Default formats and reset-to-defaults**: `DEFAULT_TEXT_FORMATS:
  TextFormat[]` is a fixed, hardcoded array (Raw / Bullet / Timestamped
  / Callout) defined once in `textFormat.ts`. "Reset to defaults" in the
  Settings tab replaces the persisted `formats` array with a **fresh
  deep copy** of `DEFAULT_TEXT_FORMATS` (fresh `id`s via
  `crypto.randomUUID()` each time) rather than reusing fixed IDs, so a
  reset behaves identically to a first install rather than silently
  reviving a stale `lastUsedFormatId` reference.
- **Settings tab (`ClipboardMonitorSettingTab`) owns list mutations
  directly**: it holds a reference to the plugin, reads
  `plugin.data.formats`, mutates the array in place (add/edit/delete/
  reorder/reset), and calls `plugin.saveData(plugin.data)` after each
  mutation, then re-renders its own list. This mirrors the existing
  split where `main.ts` is the only place that touches persistence — the
  settings tab is part of `main.ts`'s persistence boundary, not a new
  one. Rejected alternative: give the settings tab its own copy of the
  data that syncs back on tab close — adds a save-on-close edge case
  (Obsidian settings tabs don't have a reliable "closing" hook) for no
  benefit over saving on every mutation.
- **Format picker uses `FuzzySuggestModal`, not a fixed-button modal**:
  unlike `ContentTypeScopeModal`'s exactly-three-buttons design (an
  explicit rejected-alternative in `content-type-scope/design.md`), the
  format list is user-editable and open-ended, which is exactly the case
  `FuzzySuggestModal` fits. `TextFormatPickerModal` wraps
  `FuzzySuggestModal<TextFormat>`, listing `plugin.data.formats` by
  name, resolving a promise with the chosen `TextFormat`. Same
  resolve-on-close pattern as `ContentTypeScopeModal`: `onChooseItem`
  records the chosen format, and the inherited `onClose` (which
  `FuzzySuggestModal` always calls, whether a choice was made or the
  modal was dismissed with Escape/outside-click) resolves the promise
  with that choice, or `undefined` if none was made. This avoids a
  promise that never settles on dismissal — the caller `await`s it and
  treats `undefined` as "no choice made," exactly like the scope modal.
- **"Choose settings" command prompts scope, then format, in sequence**:
  two sequential `await`ed modals, matching the two-step feel of
  proposal.md §4.2 ("pick insertion format ... pick content-type
  scope") without building a combined multi-field modal for what is
  still just two independent choices.
- **Persisted data migration**: `ClipboardMonitorData` grows to `{
  lastUsedScope, formats, lastUsedFormatId }`. On load, if `formats` is
  absent (an existing `content-type-scope`-only install) or empty, seed
  it with a fresh copy of `DEFAULT_TEXT_FORMATS` and set
  `lastUsedFormatId` to the seeded Raw format's `id`; if
  `lastUsedFormatId` no longer matches any format in the list (user
  deleted the last-used one), fall back to the first format in the list.

## Risks / Trade-offs

- [A user deletes every format, leaving the list empty] → the Settings
  tab's delete action refuses to delete the last remaining format (button
  disabled when `formats.length === 1`), so the list can never go to
  zero; "Reset to defaults" is always available as an escape hatch.
- [A user's custom template omits `{{content}}`] → the copied text is
  silently dropped from the inserted block; not validated against per
  Non-Goals — documented here and in the capability spec as expected,
  user-authoring-error behavior, not a bug.
- [Growing `ClipboardMonitorData` again, as `content-type-scope`
  anticipated] → the fallback/seed logic above means older persisted
  data (`{ lastUsedScope }` only) continues to load correctly; no
  destructive migration, consistent with the no-migration-needed
  approach already used for `lastUsedScope`.

## Migration Plan

Additive on top of `content-type-scope`'s persisted shape. Existing
installs load `{ lastUsedScope }`, see no `formats` key, and get the
default list seeded in-memory on next `onload`; the enriched shape is
written back on the next `saveData()` call (any settings-tab edit, or
the first "choose settings" run). Rollback is reverting this change's
commits — a plugin already holding the enriched persisted shape simply
ignores the extra keys if downgraded, since `content-type-scope`'s
`main.ts` only ever reads `lastUsedScope` off the loaded object.

## Open Questions

None — behavior is fully specified by proposal.md §4.2 (commands,
format portion), §4.3 (managed format list, defaults, reset), and §4.6
(settings tab, format list only for this phase).
