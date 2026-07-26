# Obsidian Clipboard Monitor — Technical Proposal

Status: draft for agent spec/design/tasking
Audience: AI coding agent implementing an Obsidian community plugin

## 1. Concept

Monitor the system clipboard and automatically insert new clipboard content
(text and/or images) into a pinned target note, at that note's editor cursor,
regardless of whether Obsidian or that note's pane currently has focus.
Images are inserted using Obsidian's own attachment/link resolution, so
output is indistinguishable from a normal manual paste. Desktop only.

## 2. Feasibility Assessment

### Desktop — feasible, sole target
- Electron's `clipboard` module (`require('electron').clipboard`) is
  directly available to plugins: `readText()`, `readImage()`,
  `availableFormats()`.
- No clipboard-changed event exists on any OS/Electron; detection is via
  polling (interval, e.g. 300–500ms) with a content hash compared to the
  last-seen value, so the same clipboard entry is never inserted twice.
- Insertion at a specific note's cursor works via the `Editor` API
  (`editor.replaceRange()`), and works on a pane that is open but not
  focused — cursor/selection state persists in unfocused editors, which
  is what makes "insert while alt-tabbed to a presentation" possible.
- Image save/link uses the same public APIs Obsidian's own paste handler
  uses: `vault.createBinary()`, `fileManager.getAvailablePathForAttachment()`,
  `fileManager.generateMarkdownLink()`. These read directly from the
  user's existing Files & Links settings (attachment folder, wikilink vs
  markdown, path style) — no separate settings needed on our end, and no
  need to fake/dispatch a synthetic paste event (unreliable for unfocused
  panes anyway).

### Mobile — explicitly unsupported
- Android 10+ blocks background clipboard reads when the app isn't
  foregrounded; iOS surfaces a system "App pasted from X" banner on every
  programmatic read since iOS 14 — polling would trigger that repeatedly.
- **Decision: `isDesktopOnly: true` in the manifest.** Plugin won't install
  on mobile at all. No mobile code path to build or maintain.

## 3. Naming

**Clipboard Monitor** — plain, literal, describes exactly what it does.

## 4. Design

### 4.1 Core behavior
- **Pin on activation**: the currently active note becomes the watch
  target the moment watch mode starts.
- **Insert at that note's cursor** for as long as it stays open in any
  pane — focus doesn't matter, only "open."
- **Stop condition**: if the target note is closed *or* deleted/moved,
  watch mode stops immediately and an alert is shown. No append-to-file
  fallback — closing the note is a hard stop, same as deletion.
- **Dedupe**: hash-based — identical clipboard content is never inserted
  twice in a row. No cooldown/debounce timer; every genuinely new
  clipboard entry inserts immediately.
- **Content-type filter (per activation)**: watch mode can be scoped to
  **text only**, **images only**, or **both**. Default is **both**.
  Content not matching the active scope is ignored entirely (not queued,
  not logged) — e.g. if scoped to "text only," a copied image is simply
  skipped by the ContentRouter.

### 4.2 Commands
- **"Start watch mode"** — instant, no prompt. Active note = target.
  Reuses last-used insertion format and last-used content-type scope.
  Fast path for repeat use.
- **"Start watch mode (choose settings)"** — quick prompt: confirm/change
  target (defaults to active note), pick insertion format from the
  managed format list, pick content-type scope (text / images / both).
  Whatever is chosen becomes the new "last used" for next time.
- **"Stop watch mode"** — manual stop, in addition to the automatic
  closed/deleted stop condition.

### 4.3 Text insertion formats — managed list in Settings
Format *definitions* live in Settings as a managed, user-editable list
(add/edit/delete/reorder), each entry = name + template using a
`{{content}}` placeholder token. Ships with defaults, plus a
"Reset to defaults" action. The per-activation prompt only **selects**
from this list — no free-text entry in the hot path.

Shipped defaults (suggested):
- **Raw** — `{{content}}`
- **Bullet** — `- {{content}}`
- **Timestamped** — `**HH:MM** — {{content}}`
- **Callout** — `> [!note]\n> {{content}}`

Users can add their own entries (e.g. `- [ ] {{content}}` for tasks,
`## {{content}}` for headings) — same mechanism, not a separate "custom"
code path. Format selection only applies to text; irrelevant when scope
is images-only.

### 4.4 Images
No separate image settings. Save via `vault.createBinary()`, resolve path
via `fileManager.getAvailablePathForAttachment()`, generate the link via
`fileManager.generateMarkdownLink()`, insert the resulting string at the
stored cursor position. Output matches whatever the user already has
configured in Obsidian's own Files & Links settings.

### 4.5 Status / visibility
- **Status bar item** — baseline always-present indicator: on/off state,
  target note name, active content-type scope. Lives inside Obsidian's
  window.
- **Floating always-on-top indicator (optional, off by default, plugin
  setting to enable)** — separate frameless `alwaysOnTop` Electron
  `BrowserWindow`, small corner overlay, shows on/off state and a brief
  "✓ inserted" flash on capture. Needed because the status bar is
  invisible while alt-tabbed into a presentation — the primary use case
  (meeting screenshots) is exactly when Obsidian isn't the focused app.
  Off by default so it doesn't clutter a screen-share unintentionally.

### 4.6 Settings tab (global only)
- Poll interval
- Max clipboard content size (skip above this, to avoid huge accidental
  pastes)
- Managed text-format list (add/edit/delete/reorder/reset-to-defaults)
- Floating indicator toggle (on/off)

Explicitly **not** global: target note, insertion format, and content-type
scope — those are per-activation, remembered as "last used," not
settings-page fields.

### 4.7 Data flow
```
OS clipboard
  -> ClipboardWatcher (poll + hash dedupe)
  -> ContentRouter (content-type scope filter: text/image/both,
                     then size-cap filter)
  -> text: apply selected format template -> editor.replaceRange()
  -> image: vault.createBinary() -> getAvailablePathForAttachment()
            -> generateMarkdownLink() -> editor.replaceRange()
  -> target note closed/deleted -> stop watch mode + alert
```

## 5. Suggested Build Phases

1. ✅ **Scaffold** *(done — see `openspec/changes/scaffold/`)* — TS + esbuild
   Obsidian plugin template, `isDesktopOnly: true`.
2. ✅ **Watch mode core** *(done — see
   `openspec/changes/watch-mode-core/`)* — polling watcher, hash dedupe,
   pinned target note, cursor insert for open (unfocused-OK) panes,
   closed/deleted stop + alert, status bar indicator.
3. ✅ **Content-type scope** *(done — see
   `openspec/changes/content-type-scope/`)* — per-activation
   text/images/both selector, ContentRouter filtering, "last used"
   persistence.
4. ✅ **Text formats** *(done — see
   `openspec/changes/text-formats/`)* — managed format list in Settings
   (defaults + reset), per-activation format picker, "last used"
   persistence for target/format.
5. **Images** — attachment save + link generation via Obsidian's own
   FileManager APIs.
6. **Floating indicator** — optional always-on-top overlay window,
   settings toggle.
7. **Polish** — size cap, docs, release prep.

## 6. Resolved Decisions Log
- Background capture: **true background**, works regardless of app focus.
- Mobile: **unsupported**, `isDesktopOnly: true`.
- Target note: **pinned on activation = active note**, no picker.
- Note closed/deleted: **hard stop + alert**, no append fallback.
- Dedupe: **hash-based, no cooldown**, immediate insert.
- Insertion format: **managed list in Settings**, per-activation select
  only, remembered as last-used.
- Content-type scope: **per-activation (text / images / both)**,
  default **both**, remembered as last-used.
- Image handling: **no plugin-side settings**, defers entirely to
  Obsidian's Files & Links settings via public FileManager APIs.
- Floating indicator: **plugin setting, off by default**.
