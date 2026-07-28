## Why

Automatic stop (target note closed, deleted, or renamed/moved) already shows a `Notice` stating why — but a manual "Stop watch mode" is silent, as is the internal stop-then-restart that happens when starting a new session while one is already running. All are the same event from the user's perspective (watch mode is no longer running the way it was a moment ago), yet only the automatic paths currently confirm it, and only they say why.

Starting has the mirror problem: "Start watch mode" reuses the last-used content-type scope and text format silently — the only place that combination is surfaced is the status bar text, which the user has to go looking for. A `Notice` at the moment of starting confirms what's about to happen without requiring that lookup.

## What Changes

- Show a `Notice` when watch mode starts (both "Start watch mode" and "Start watch mode (choose settings)"), stating the target note, content-type scope, and text format — the same information already shown in the status bar, surfaced at the moment it takes effect.
- Show a `Notice` whenever watch mode stops, for any reason, stating why: manual stop, target note closed, target note deleted, target note renamed/moved, or restarting (an already-running session was replaced by a new one). The automatic paths already state a reason today; this extends the same reason-bearing notice to the manual and restart paths, which are currently silent.
- Consolidate `WatchModeController`'s current split between a silent `stop()` and a notifying `stopWithNotice()` into one path, so notification is a property of "watch mode stopped," not of which caller triggered it — no per-call-site decisions to keep in sync.
- No new setting: this matches the existing auto-stop notices, which are unconditional today with no opt-out.
- No per-capture / insertion notice — the note being appended to is confirmation enough; only start/stop-family events get a `Notice`.
- All notice text (start and stop, including the existing automatic-stop notices) is run through `t()` and translated in every shipped locale (en/fr/es/ar), matching how the no-active-file notice and command names already work. The stop reason becomes a translation key (e.g. `notice.stop_reason.manual`, `notice.stop_reason.note_closed`, `notice.stop_reason.note_deleted`, `notice.stop_reason.note_moved`, `notice.stop_reason.restarting`) interpolated into a `notice.stopped` template, rather than the current internal English reason string being spliced directly into user-facing text.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `watch-mode-core`:
  - "Requirement: Start watch mode pins the active note" gains a `Notice` confirming target/scope/format when a session starts successfully (today it only specifies a `Notice` for the no-active-note failure case).
  - "Requirement: Stop watch mode command" gains a reason-stating `Notice` on manual stop (currently only specifies polling stop + status bar update). "Requirement: Automatic stop on note closed or deleted/moved" is unchanged in behavior, but its notice now shares one code path with the manual/restart cases instead of being the only one that notices.

## Impact

- `src/ts/watchMode/watchModeController.ts`:
  - `start()`: add a `Notice` alongside the existing `onStatusChange` call, reusing the same `target.basename` / `scopeLabel` / `format.name` values already computed there.
  - Merge `stop()`/`stopWithNotice()`; every real stop (not the no-op "already stopped" case) shows a `Notice` stating the reason.
- No changes to `main.ts`, settings tab, or `WatchModeHost` — reuses the existing `host.notice()` seam.
- `src/ts/i18n/locales/*.json`: add translation keys for the start notice, the stop notice template, and each stop reason, in all four locales.
- The internal `reason` parameter passed through `stop()` (currently a free-form English string like `"note closed"`, also used in `logger.info` calls) needs to separate from the *translation key* used to build the notice — logs can stay as stable English identifiers; only the user-facing `Notice` text goes through `t()`. Exact shape (string union type, or a small reason → key map) is a design.md decision.
