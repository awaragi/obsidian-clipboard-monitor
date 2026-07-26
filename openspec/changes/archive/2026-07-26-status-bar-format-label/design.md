## Context

`WatchModeController.start()` already computes everything needed to
describe the running session (`target`, `scope`, `format`) and reports it
via `host.onStatusChange(status: WatchModeStatus)`, which `main.ts` uses
to set the status bar text. Today `WatchModeStatus` only carries
`targetName` and `scopeLabel`; `format` is known to the controller but
never reaches the status/UI layer.

## Goals / Non-Goals

**Goals:**
- Surface the active format's display name in the status bar, using the
  same running/stopped shape `WatchModeStatus` already has for the other
  two fields.

**Non-Goals:**
- No change to how format names are derived (`TextFormat.name` already
  exists and is used elsewhere, e.g. the settings modal's dropdown).
- No change to the settings modal or persisted `lastUsedFormatId`.

## Decisions

- **Add `formatLabel: string | null` to `WatchModeStatus`**, following
  the exact pattern of `targetName`/`scopeLabel`: non-null while running,
  `null` while stopped. Keeps the three fields symmetric rather than
  introducing a different shape (e.g. an optional field) for just this
  one.
- **Use `format.name` directly** in `WatchModeController.start()` — no
  new lookup helper needed, unlike `scopeLabel()` which maps a
  `ContentTypeScope` enum value to a label. `TextFormat.name` is already
  the display string.
- **Render order in `main.ts`**: target — scope — format, appending the
  new field after the existing two (`"Clipboard Monitor: {target} —
  {scope} — {format}"`), since target and scope are already established
  and format is the new, most specific detail.

## Risks / Trade-offs

- [Status bar text grows longer, could crowd a narrow status bar] →
  acceptable; format names are expected to be short (a handful of named
  templates, same assumption `watch-settings-modal`'s dropdown already
  makes), and Obsidian's status bar truncates/wraps items to available
  width same as before this change.
