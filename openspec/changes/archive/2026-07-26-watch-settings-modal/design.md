## Context

`content-type-scope` and `text-formats` each added their own modal
(`ContentTypeScopeModal`, a fixed-button `Modal`; `TextFormatPickerModal`,
a `FuzzySuggestModal`) and chained them sequentially in
`startWatchModeChooseSettings`, each `await`ed in turn with a silent
`if (!x) return;` guard modeled on "dismissal means cancel." That
convention is fine for a single modal, but chaining two of them means two
independent resolve-on-close contracts have to both succeed for anything
to happen, and neither failure path gives the user any feedback. In
practice the command now prompts twice and then does nothing, which
without any Notice or console signal is very hard to distinguish from "I
must have missed a click" — this design consolidates to one modal
specifically to remove that failure surface, not just to reproduce it in
one dialog instead of two.

## Goals / Non-Goals

**Goals:**
- One combined modal presents every per-activation setting together —
  currently the target note (read-only display), content-type scope, and
  text format (the latter two editable, pre-filled with last-used
  values) — with unambiguous **Watch** / **Cancel** actions.
- Choosing **Watch** always starts watch mode with the selected values;
  anything else always cancels cleanly with no partial state change.
- Preserve existing behavior: chosen scope/format become the new "last
  used" (persisted via `saveData`); target is still always the active
  note.
- Establish `WatchModeSettingsModal` as the durable home for
  per-activation settings: a future change that adds another per-session
  choice extends this modal (new field, same Watch/Cancel contract)
  rather than introducing another chained dialog.

**Non-Goals:**
- No target-note *picker* — the target field is informational only
  (shows which note will be watched); changing it is still out of scope,
  per `content-type-scope/design.md`'s existing Non-Goal. Watch mode can
  only insert into a note that's open in some pane, so a real picker
  needs its own open-notes enumeration and validation — separate,
  larger work than this bug fix.
- No changes to the fast-path "Start watch mode" command.
- No retry/error-notice UX for the (now structurally much less likely)
  case of a stuck modal — the fix is making the resolve path
  unambiguous, not adding defensive handling around it.

## Decisions

- **Single `WatchModeSettingsModal extends Modal`** replacing both prior
  modals, using Obsidian's `Setting` component for a read-only target-name
  row, two dropdown rows (content-type scope, text format), and a button
  row (**Watch** / **Cancel**), rather than `FuzzySuggestModal` for the
  format field. Dropdowns are simpler and sufficient for the format
  list's expected size (a handful of named templates), and — unlike
  `FuzzySuggestModal`'s implicit "choosing closes the modal" contract —
  a dropdown's value is always a definite, synchronously-readable string,
  removing the ambiguity that's the leading suspect for the current bug.
- **Target is a plain info row, not a control**: `Setting(...).setName
  ("Target").setDesc(target.basename)`, with no input element. It exists
  so the user can confirm which note is about to be watched (matching
  proposal.md §4.2's "confirm ... target") without implying it's
  editable — editable-target is explicitly deferred (see Non-Goals). This
  also means the modal's constructor takes `target: WatchModeTarget`
  purely for display; `main.ts` still resolves the target from the active
  file and passes the same object to `controller.start()` afterward, no
  new plumbing needed.
- **Modal is the designated extension point for future per-activation
  settings**: documented here explicitly (and in a code comment on the
  class) so the next change that needs a new per-session choice adds a
  field to this modal and to `WatchModeSettingsChoice`, instead of
  reaching for a new chained-modal pattern — the pattern this bug came
  from in the first place.
- **Explicit `confirmed` flag, set only by the Watch button's click
  handler**, mirrors the same resolve-on-`onClose` pattern the previous
  modals used (`resolve(confirmed ? { scope, format } : undefined)` in
  `onClose`), but the boolean is set by exactly one code path (the Watch
  button), not inferred from "was an item chosen" state that a
  suggest-modal's internal event sequencing controls. Cancel's button
  handler just calls `close()` without setting `confirmed`, and
  dismissal (Escape / outside click) behaves identically since it also
  only triggers `close()` → `onClose()`.
- **Pre-filled with last-used values**: the modal takes
  `initialScope: ContentTypeScope` and `initialFormatId: string` in its
  constructor (mirroring what `main.ts` already has on hand from
  `this.data`) and sets each dropdown's initial value accordingly, falling
  back to the first format if `initialFormatId` doesn't match any format
  (same fallback rule `resolveLastUsedFormatId` already applies
  elsewhere). This is a small UX improvement over the previous modals
  (which had no memory of prior choices within the picker itself) and
  costs nothing extra to wire, since `main.ts` already tracks both values.
- **`contentTypeScopeModal.ts` and `textFormatPickerModal.ts` are
  deleted outright**, not deprecated — they have exactly one call site
  (`main.ts`), no other references, and no unit tests (thin UI wiring,
  consistent with this project's testability rule that only logic-bearing
  code needs `.spec.ts` coverage).

## Risks / Trade-offs

- [Root cause of the original bug isn't independently confirmed — I
  can't drive the real Obsidian Electron app from this environment to
  reproduce it directly] → the fix is structural: the new modal cannot
  exhibit the same "implicit resolve never fires" failure mode regardless
  of the exact prior mechanism, since `confirmed` is set by exactly one
  explicit click handler. Manual verification (tasks §3) is how this gets
  confirmed against the real app.
- [Dropdowns list formats by name only, no fuzzy search] → acceptable for
  the expected list size (a handful of formats); if a user grows the list
  very large, revisit — not a concern raised by any existing proposal.

## Migration Plan

Net-new modal on top of existing persisted state (`lastUsedScope`,
`lastUsedFormatId`) — no data migration. Rollback is reverting this
change's commits, restoring the two-modal flow (bug and all).

## Open Questions

None — the fix is fully scoped by the explicit request: one modal, Watch
and Cancel buttons, and it must actually start watch mode.
