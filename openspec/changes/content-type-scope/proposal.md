## Why

`watch-mode-core` inserts every clipboard text change unconditionally.
Per proposal.md §5 (Build Phase 3), the next step is letting the user
scope each watch-mode session to text-only, images-only, or both — so
that, for example, a user who only wants text captured isn't bothered by
irrelevant clipboard noise, and the plugin has the routing concept in
place before Phase 5 adds real image insertion behind the same gate.

## What Changes

- Add a `ContentTypeScope` concept (`"text" | "image" | "both"`, default
  `"both"`) that governs whether newly detected clipboard text is
  inserted. Per proposal.md §4.1, scope is per-activation, not a global
  setting.
- Add a `ContentRouter`-style gate: when the active scope excludes text
  (i.e. scope is `"image"`), newly detected clipboard text is silently
  ignored — not inserted, not logged, not queued.
- Add a "Start watch mode (choose settings)" command: prompts for content-
  type scope (Text only / Images only / Both) via a simple picker, applies
  it to the current active note, and remembers the choice as "last used".
- "Start watch mode" (the existing fast-path command) now reuses the
  last-used content-type scope instead of implicitly always allowing
  everything.
- The plugin persists `lastUsedScope` via `loadData()`/`saveData()` — this
  is the plugin's first piece of persisted state. It is **not** a settings-
  tab field (proposal.md §4.6 explicitly excludes content-type scope from
  global settings); it is per-activation "last used" state.
- The status bar indicator (from `watch-mode-core`) now also shows the
  active content-type scope alongside on/off state and target name, per
  proposal.md §4.5.
- **Scope `"image"` currently has no observable effect on images
  themselves** — actual image detection/insertion is Build Phase 5. For
  this change, choosing "Images only" simply means text is never
  inserted (since nothing else is implemented yet to insert); this is
  documented, not a bug, and is revisited when Phase 5 lands.

## Capabilities

### New Capabilities
- `content-type-scope`: per-activation text/image/both scope selection,
  the text-insertion gate it drives, the "choose settings" command, last-
  used persistence, and the status bar's scope display.

### Modified Capabilities
(none — `openspec/specs/` has no archived capabilities yet for this
project; the insertion-gating and status-bar-text changes described above
build on `watch-mode-core`'s in-progress spec but are expressed here as
part of the new `content-type-scope` capability rather than as a delta
against an unarchived base)

## Impact

- Affected code: `src/ts/watchMode/watchModeController.ts` (gate insertion
  on scope, include scope in status), `src/ts/main.ts` (new command, data
  persistence, status bar text), new `src/ts/watchMode/contentTypeScope.ts`
  (type + router), new scope-picker UI.
- Data shape: plugin now has persisted data
  (`{ lastUsedScope: ContentTypeScope }`) — first use of `loadData()`/
  `saveData()` in this project.
- No new dependencies; no mobile impact (`isDesktopOnly: true` unchanged).
