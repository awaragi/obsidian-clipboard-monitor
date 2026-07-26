## Why

`watch-mode-core` inserts detected clipboard text raw, with a hardcoded
trailing newline. Per proposal.md §5 (Build Phase 4), the next step is
letting the user apply a named template (Raw / Bullet / Timestamped /
Callout, or their own) to each inserted entry, manage that list of
templates in a Settings tab, and pick one per-activation the same way
content-type scope already works — so a user journaling meeting notes can
get `- {{content}}` bullets without hand-formatting every paste.

## What Changes

- Add a `TextFormat` concept: `{ id, name, template }`, where `template`
  is a string containing a `{{content}}` placeholder token. Ships with
  four default formats (Raw `{{content}}`, Bullet `- {{content}}`,
  Timestamped `**HH:MM** — {{content}}`, Callout `> [!note]\n>
  {{content}}`), per proposal.md §4.3.
- Add a `renderFormat(template, content): string` pure function that
  substitutes `{{content}}` (and, for Timestamped, the current time) into
  a template — replacing `WatchModeController`'s current hardcoded
  `` `${text}\n` `` insertion body.
- Add the **first Settings tab** (`ClipboardMonitorSettingTab`) with a
  managed, user-editable list of text formats: add / edit / delete /
  reorder, plus a "Reset to defaults" action. Per proposal.md §4.6, this
  settings tab is global — the format *definitions* live here; which
  format is *active* does not.
- Extend "Start watch mode (choose settings)" to also prompt for an
  insertion format (in addition to the existing content-type scope
  prompt), selecting from the managed list. Whatever is chosen becomes
  the new "last used" format, per proposal.md §4.2.
- "Start watch mode" (the fast-path command) now reuses the last-used
  format in addition to the last-used content-type scope.
- Extend the plugin's persisted data (`main.ts`'s `ClipboardMonitorData`,
  first introduced in `content-type-scope`) with `formats: TextFormat[]`
  and `lastUsedFormatId: string`, per the migration note in
  `content-type-scope/design.md` ("Phase 4 extends it with additional
  keys rather than replacing it").
- **BREAKING** (internal only, no user-facing settings migration needed
  since no format state existed before this change):
  `WatchModeController.start()` gains a `format: TextFormat` parameter,
  mirroring how `scope` was added in `content-type-scope`.

## Capabilities

### New Capabilities
- `text-formats`: the `TextFormat` type and default list, the
  `renderFormat` template-substitution function, the managed-list
  Settings tab (add/edit/delete/reorder/reset), the format picker in
  "choose settings", and last-used format persistence and reuse in the
  fast-path command.

### Modified Capabilities
(none — `openspec/specs/` has no archived capabilities yet for this
project; the change to how inserted text is composed — template
substitution instead of a hardcoded trailing newline — builds on
`watch-mode-core`'s and `content-type-scope`'s in-progress specs but is
expressed here as part of the new `text-formats` capability rather than
as a delta against an unarchived base)

## Impact

- Affected code: `src/ts/watchMode/watchModeController.ts` (accept and
  apply the active format instead of the hardcoded newline body),
  `src/ts/main.ts` (new command prompt step, extended persisted data
  shape, register the new settings tab), new
  `src/ts/watchMode/textFormat.ts` (type, defaults, `renderFormat`), new
  `src/ts/settings/clipboardMonitorSettingTab.ts` (managed list UI), new
  format-picker UI (likely folded into an extended
  `ContentTypeScopeModal`-style flow, or a second modal step — a design
  decision, not fixed here).
- Data shape: `ClipboardMonitorData` grows from `{ lastUsedScope }` to
  `{ lastUsedScope, formats, lastUsedFormatId }`. Existing installs from
  `content-type-scope` (which only ever wrote `lastUsedScope`) fall back
  to default formats and `lastUsedFormatId` pointing at "Raw" when those
  keys are absent — no destructive migration.
- No new dependencies; no mobile impact (`isDesktopOnly: true` unchanged).
