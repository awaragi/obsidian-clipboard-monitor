## Why

The `scaffold` change produced a buildable but functionally empty plugin.
Per proposal.md §5 (Build Phase 2), the next step is the core watch-mode
loop — clipboard polling, dedupe, a pinned target note, cursor insertion,
and the closed/deleted stop condition — since every later phase (content-
type scope, text formats, images, floating indicator) builds on top of
this loop existing and working.

## What Changes

- Add a `ClipboardWatcher` that polls the Electron clipboard on an
  interval and detects new content via content hashing (no re-insert of
  the same clipboard entry twice in a row, no cooldown timer).
- Add a "Start watch mode" command that pins the currently active note as
  the watch target and begins polling immediately, with no prompt.
- Add a "Stop watch mode" command for manual stop.
- Insert newly detected **text** clipboard content at the target note's
  editor cursor via `editor.replaceRange()`, working on a pane that is
  open but not focused, and advance the tracked cursor position past the
  inserted text so consecutive insertions append in sequence rather than
  overwriting each other.
- Add the automatic stop condition: if the target note is closed in every
  pane, or is deleted/renamed away, watch mode stops immediately and a
  `Notice` alert is shown.
- Add a status bar item showing on/off state and the target note's name.
- Text is inserted raw (`{{content}}`, unformatted) for this change — the
  managed text-format list (proposal.md §4.3) is out of scope until Build
  Phase 4.
- Clipboard **images** are ignored entirely in this change (neither
  inserted nor logged) — image handling (proposal.md §4.4) is out of scope
  until Build Phase 5. This also means there is no content-type scope
  selector yet (proposal.md §4.1, §4.3) — that arrives in Build Phase 3;
  until then, watch mode only ever watches text.

## Capabilities

### New Capabilities
- `watch-mode-core`: the polling clipboard watcher, hash-based dedupe,
  pinned-target-note lifecycle (start/stop, closed/deleted auto-stop),
  cursor-position text insertion, and the status bar indicator.

### Modified Capabilities
(none — `project-scaffold` from the prior change is tooling, not a
runtime capability with requirements this change alters)

## Impact

- Affected code: new `src/ts/watcher/` (ClipboardWatcher), new
  `src/ts/main.ts` changes (register commands, status bar item, lifecycle
  wiring), new settings shape for poll interval (proposal.md §4.6, partial
  — only the poll interval setting is in scope here; max content size,
  managed format list, and floating indicator toggle are later phases).
- Dependencies: none new — uses Obsidian's `Editor`, `Vault`, `Workspace`
  APIs and Electron's `clipboard` module, already available via the
  `obsidian` package installed in `scaffold`.
- No mobile impact — plugin remains `isDesktopOnly: true`.
