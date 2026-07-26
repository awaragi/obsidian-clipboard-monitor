## Why

"Start watch mode (choose settings)" is broken: it prompts for a
content-type scope, then a text format, one modal after another — but
after answering both, watch mode does not start. Both `startWatchModeChooseSettings`'s
guard clauses (`if (!scope) return;` / `if (!format) return;`) fail
completely silently, so any inconsistency in either modal's resolve path
(most likely `TextFormatPickerModal`, a `FuzzySuggestModal` whose
resolve-on-close contract is less explicit than a plain button click)
produces exactly this symptom: prompts appear, the user answers them, and
nothing happens — no watch mode, no error. This also was never actually
manually verified — the relevant checklist item in
`content-type-scope/tasks.md` (§5.2) was left unchecked.

## What Changes

- Replace the two sequential modals (`ContentTypeScopeModal`,
  `TextFormatPickerModal`) with a single `WatchModeSettingsModal` that
  shows **every per-activation ("watch session") setting together**:
  the target note (shown for information, read-only — still always the
  active note, same as today), content-type scope, and text format — the
  latter two as dropdowns, pre-filled with the last-used values — with
  explicit **Watch** and **Cancel** buttons. Only clicking **Watch**
  resolves a choice; anything else (Cancel, Escape, outside click)
  unambiguously resolves "no choice" — removing the class of bug where an
  implicit modal-close event could silently fail to carry a choice
  through.
- Adds the target-note **display** proposal.md §4.2 always specified
  ("confirm ... target (defaults to active note)") — shown as a read-only
  info line, not a picker; changing the target is still out of scope
  (unchanged Non-Goal from `content-type-scope`/`text-formats` — watch
  mode can only insert into a note that's open in some pane, so a target
  picker is a separate, larger piece of work).
- Establishes `WatchModeSettingsModal` as the intended single home for
  **all future per-activation settings**, not just these — later changes
  that add another per-session (as opposed to global-settings-tab) choice
  should extend this modal rather than adding another chained dialog,
  which is what caused this bug in the first place.
- **BREAKING** (internal only): delete `contentTypeScopeModal.ts` and
  `textFormatPickerModal.ts`; `main.ts#startWatchModeChooseSettings` now
  awaits one modal instead of two.
- No change to the fast-path "Start watch mode" command, to
  `ContentTypeScope`/`TextFormat` types, or to `WatchModeController` —
  this only touches the "choose settings" command's prompt UI.

## Capabilities

### New Capabilities
- `watch-settings-modal`: the combined content-type-scope + text-format
  prompt for "Start watch mode (choose settings)" — a single modal with
  Watch/Cancel actions, replacing the two chained modals.

### Modified Capabilities
(none — `openspec/specs/` has no archived capabilities yet for this
project; this capability supersedes the "choose settings" prompt behavior
introduced across `content-type-scope` and `text-formats`, expressed here
as a new capability rather than as deltas against unarchived bases,
consistent with how those changes and `images` handled the same
situation)

## Impact

- Affected code: `src/ts/main.ts` (`startWatchModeChooseSettings`), new
  `src/ts/watchMode/watchModeSettingsModal.ts`, removes
  `src/ts/watchMode/contentTypeScopeModal.ts` and
  `src/ts/watchMode/textFormatPickerModal.ts`.
- No data-shape changes — still reads/writes the existing
  `lastUsedScope` / `lastUsedFormatId` fields.
- No new dependencies.
