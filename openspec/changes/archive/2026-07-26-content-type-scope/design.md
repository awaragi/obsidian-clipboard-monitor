## Context

`watch-mode-core` built `WatchModeController` around a `WatchModeHost`
seam and an injectable watcher factory specifically so later phases could
extend behavior without breaking existing unit tests. This change adds
the content-type scope concept on top of that: a per-activation choice
(text/image/both) that gates whether detected clipboard text is inserted,
plus the "choose settings" command and status bar display proposal.md
§4.1–4.2, §4.5, §4.6 call for.

Constraint carried over from `watch-mode-core`'s design: no Settings tab
exists yet (deferred to Phase 4), and per proposal.md §4.6, content-type
scope is explicitly **not** a settings-tab field anyway — it's per-
activation, remembered as "last used" via plugin data, not a config page.

## Goals / Non-Goals

**Goals:**
- Text insertion is gated by the active content-type scope: scope
  `"image"` blocks text insertion; scope `"text"` or `"both"` allow it.
- "Start watch mode (choose settings)" lets the user pick a scope for
  this session via a simple modal, applied to the active note.
- "Start watch mode" (fast path) reuses the last-used scope, persisted
  across Obsidian restarts via `loadData()`/`saveData()`.
- Status bar shows the active scope alongside on/off state and target
  name.

**Non-Goals:**
- No actual image detection, saving, or insertion — that's Phase 5. Scope
  `"image"` is a real, storable, selectable value now, but until Phase 5
  it has no positive effect (nothing is ever inserted under it); it only
  negatively gates text. This is intentional groundwork, not a stub to
  delete later — the gate itself (`shouldInsertText`) doesn't change when
  Phase 5 lands, only a new `shouldInsertImage` counterpart is added.
- No target picker or format picker in the "choose settings" command —
  target still defaults to the active note (same as the fast path); format
  selection depends on Phase 4's managed format list, which doesn't exist
  yet. The "choose settings" command in this change offers **only** the
  scope choice; proposal.md §4.2's full three-way prompt is completed
  incrementally as Phase 4 lands.
- No Settings tab — scope is per-activation state, not a settings field
  (proposal.md §4.6 explicitly excludes it), so this doesn't force the
  Settings-tab question that Phase 4 will actually need to answer.

## Decisions

- **`ContentTypeScope = "text" | "image" | "both"`**, default `"both"`,
  defined once in `src/ts/watchMode/contentTypeScope.ts` alongside a pure
  `shouldInsertText(scope): boolean` gate (`scope !== "image"`). Kept as a
  tiny, separately tested unit rather than inlined in the controller, so
  Phase 5 can add `shouldInsertImage(scope)` next to it without touching
  controller internals.
- **Gate lives in `WatchModeController.handleNewText`**, called before
  `insertText` (same call site as the Phase 2 newline decision) — checked
  first, so a scope that excludes text skips insertion entirely (no
  newline appended, no cursor moved, nothing).
- **Scope travels with `start()`, not as separate mutable state**:
  `WatchModeController.start(target, scope)` takes the scope explicitly
  for that session, mirroring how `target` already works. Alternative
  considered: a `setScope()` mutator on the running controller — rejected
  because proposal.md never describes changing scope mid-session, only at
  activation time.
- **Persistence lives in `main.ts`, not the controller**: `main.ts` loads
  `{ lastUsedScope }` via `this.loadData()` at `onload`, passes it to
  `controller.start()` for the fast-path command, and saves a new value
  via `this.saveData()` when the "choose settings" command's picker
  resolves. The controller itself stays persistence-agnostic — consistent
  with `watch-mode-core`'s existing split (host handles environment
  concerns, controller handles lifecycle logic only).
- **Scope picker UI**: a minimal Obsidian `Modal` subclass
  (`ContentTypeScopeModal`) with three buttons (Text only / Images only /
  Both), resolving a promise with the chosen `ContentTypeScope`. Rejected
  alternative: `FuzzySuggestModal` — overkill for exactly three fixed
  options with no search need.
- **Status bar text becomes `"Clipboard Monitor: <target> — <scope
  label>"`** when running (e.g. "Clipboard Monitor: Meeting Notes — text
  only"), `"Clipboard Monitor: off"` when stopped — extends
  `WatchModeStatus` with a `scopeLabel: string | null` field rather than
  the raw `ContentTypeScope`, so display formatting stays out of the
  controller.

## Risks / Trade-offs

- ["Images only" scope currently makes watch mode insert nothing at all,
  which could read as broken rather than "not yet implemented"] →
  mitigated by using an explicit label ("Images only") in both the picker
  and status bar, and documented here and in the capability spec as
  expected until Phase 5; no silent behavior change once Phase 5 lands
  (the gate function is the same, only a new image path is added
  alongside it).
- [First use of `loadData()`/`saveData()` in this project — a data-shape
  decision now constrains Phase 4, which will need to persist more
  (format list, last-used format, floating-indicator toggle, etc.)] →
  the persisted shape is a plain object (`{ lastUsedScope }`); Phase 4
  extends it with additional keys rather than replacing it, so no
  migration is needed.

## Migration Plan

Net-new on top of `watch-mode-core`; no persisted data exists yet to
migrate (this change introduces the first persisted shape). Rollback is
reverting this change's commits — `loadData()` returning `undefined`/`{}`
on a fresh install already falls back to the default scope (`"both"`).

## Open Questions

None — behavior is fully specified by proposal.md §4.1 (scope + filtering
rule), §4.2 (commands, scope portion only), §4.5 (status bar), and §4.6
(scope is per-activation, not a setting).
