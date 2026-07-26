## Context

The `scaffold` change left `src/ts/main.ts` as a no-op `Plugin`. This
change adds the first real behavior: a polling clipboard watcher that
inserts new text into a pinned note's cursor, per proposal.md §4.1–4.2,
§4.5 (status bar only), and §4.7 (data flow, text path only — no content-
type routing or formatting yet).

Obsidian plugin constraints that shape this design:
- No native "clipboard changed" event exists on any OS/Electron — polling
  is the only option (proposal.md §2).
- `Editor` objects for a pane keep their own cursor/selection state even
  when that pane isn't focused, which is what makes background insertion
  into an alt-tabbed note possible (proposal.md §2).
- There's no direct "leaf closed" event; `workspace.on("layout-change")`
  fires on leaf open/close/split/etc. and is the practical way to detect a
  pane disappearing without polling the workspace tree separately from the
  clipboard timer.

## Goals / Non-Goals

**Goals:**
- Poll the clipboard and detect genuinely new text content via hashing,
  never inserting the same entry twice in a row.
- "Start watch mode" pins the active note instantly (no prompt) and
  begins inserting new clipboard text at that note's cursor, in any pane
  showing it, focused or not.
- "Stop watch mode" stops manually; closing every pane showing the target
  note, or deleting/renaming/moving it, stops automatically and shows a
  `Notice`.
- A status bar item reflects on/off state and the target note's name.

**Non-Goals:**
- No content-type scope (text/images/both) — everything watched is
  treated as text; clipboard images are ignored outright. That's Build
  Phase 3.
- No managed text-format templates — inserted text is raw, unformatted.
  That's Build Phase 4.
- No image saving/linking. That's Build Phase 5.
- No floating always-on-top indicator. That's Build Phase 6.
- No settings tab UI yet — the poll interval is a hardcoded constant for
  this change; a real Settings tab arrives in Build Phase 4 once there are
  enough fields (poll interval, max size, format list, floating-indicator
  toggle) to justify one. Building a one-field settings tab now and
  reworking it in Phase 4 is avoidable churn.
- No "choose settings" variant of the start command (target/format/scope
  picker) — that depends on content-type scope (Phase 3) and format list
  (Phase 4), both out of scope here.

## Decisions

- **Each inserted entry gets a trailing newline**, applied in
  `WatchModeController.handleNewText` (not inside `insertText`, which
  stays a format-agnostic raw-splice primitive). Without it, consecutive
  clipboard entries land back-to-back on the same visual line, which is
  what manual testing against this change surfaced. This is a stopgap
  default until Phase 4's managed text-format templates give the user
  control over the exact insertion string; keeping the newline at the
  controller call site (rather than inside `insertText`) means Phase 4
  only has to swap that one line for a template lookup.
- **Dedupe via content hash of the read text**, compared against the last
  seen hash; identical hash → skip. Matches proposal.md §4.1 exactly and
  avoids holding onto stale full-text copies just for comparison.
  Implementation: Node's built-in `crypto.createHash("sha256")` — no new
  dependency.
- **No stored/tracked insertion cursor — use the editor's live cursor on
  every insert.** On each new clipboard entry: read `editor.getCursor()`,
  `editor.replaceRange(text, cursor, cursor)`, then `editor.setCursor()`
  to the position just past the inserted text. This means: (a) successive
  insertions chain correctly (each starts where the last one ended), (b)
  if the pane is focused and the user has moved their own cursor, the next
  insertion respects that instead of jumping to a stale position, and (c)
  if the pane is unfocused, the cursor simply stays where watch mode left
  it, since nothing else can move it. Alternative considered: maintain a
  separately tracked `EditorPosition` independent of the editor's own
  cursor — rejected as unnecessary state that could drift from what the
  user actually sees.
- **Target leaf lookup by scanning, not by leaf reference.** Store only
  the target `TFile`, not a specific `WorkspaceLeaf` — on each insertion,
  scan `workspace.getLeavesOfType("markdown")` for a leaf whose view's
  file matches. If the note is open in multiple panes, the first match
  found is used (order is whatever Obsidian's internal leaf list returns).
  Rationale: leaf references can go stale (split, moved, closed-and-
  reopened); re-resolving by file is simple and self-correcting. The
  multi-pane-ambiguity edge case is accepted as a known limitation (see
  Risks).
- **Stop detection via events, not the poll timer.** Register
  `workspace.on("layout-change")` to check "is the target file still open
  in some leaf?" and `vault.on("delete")` / `vault.on("rename")` to check
  "does the target file still exist at the path we pinned?". Any of these
  firing "no" stops watch mode immediately and calls
  `new Notice(...)`. Rejected alternative: checking closed/deleted state
  only on the clipboard poll tick — would work but adds up to one poll
  interval of lag before the "immediate" stop the proposal calls for,
  for no implementation savings (the watcher already needs cleanup logic
  either way).
- **Poll interval constant**: 400ms, matching the middle of the
  proposal's suggested 300–500ms range (proposal.md §2). Revisited when
  Phase 4 adds a real settings field for it.
- **Status bar content for this change**: `"Clipboard Monitor: <target
  note name>"` when running, hidden or `"Clipboard Monitor: off"` when
  stopped. Content-type scope display (mentioned in proposal.md §4.5) is
  added in Phase 3 once scope exists.

## Risks / Trade-offs

- [Same note open in multiple panes] → insertion always targets the first
  matching leaf found; the other pane(s) simply don't receive the
  inserted text (but do reflect it once Obsidian syncs the underlying
  file content). Acceptable for this phase; not a documented proposal
  requirement to support multi-pane fan-out.
- [`layout-change` fires very frequently for unrelated reasons (resize,
  unrelated tab switches)] → the "is target still open" check is a cheap
  leaf scan, so the extra invocations are not a performance concern.
- [400ms poll interval is a guess, not yet user-configurable] → mitigated
  by being in the middle of the proposal's own suggested range; revisited
  when Phase 4 adds the settings tab.
- [Clipboard read failures (e.g. transient Electron API errors)] → a
  failed poll tick is treated as "no new content" and simply retried next
  tick; it does not stop watch mode or throw.

## Migration Plan

Net-new behavior on top of the scaffold's no-op plugin; no existing state
to migrate. Rollback is reverting this change's commits — no persisted
data format is introduced (no settings shape changes are saved yet, since
the poll interval is a hardcoded constant).

## Open Questions

None — behavior is fully specified by proposal.md §4.1, §4.2 (start/stop
only), and §4.5 (status bar baseline only); scope explicitly excludes the
content-type, format, image, and floating-indicator concerns that would
otherwise raise open questions.
