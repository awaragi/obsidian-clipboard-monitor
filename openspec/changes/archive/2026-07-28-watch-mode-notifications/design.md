## Context

`WatchModeController` currently has two exit paths that both end a running session but behave differently:

- `stop(reason = "manual stop")` — silent. Called by the "Stop watch mode" command, and internally by `start()` when a session is already running (restart-before-start).
- `stopWithNotice(reason)` — calls `host.notice(...)` with a hardcoded English template, then delegates to `stop(reason)`. Called only by the three automatic-stop checks (`checkStillOpen`, `checkDeleted`, `checkRenamed`).

`start()` never notices at all — session settings are only visible via the status bar text (`onStatusChange`).

All existing user-facing strings in this codebase go through `t()` (see `i18n.ts`, tested for per-locale completeness in `i18n.spec.ts`) except this one hardcoded notice template — an existing gap this change closes while it's already touching the code.

## Goals / Non-Goals

**Goals:**
- Every stop, regardless of cause (manual, restart, note closed/deleted/moved), shows a `Notice` stating why, through one code path.
- Every start (both commands) shows a `Notice` stating target, content-type scope, and text format.
- All notice text — new and pre-existing — is translated in en/fr/es/ar via `t()`.
- No new setting, no per-capture notice.

**Non-Goals:**
- No OS-level notification, no floating/always-on-top window (see the superseded `floating-indicator` exploration — an in-app `Notice` was deliberately chosen instead).
- No change to `WatchModeHost`'s public shape — `notice(message: string)` already takes a fully-formed string; only the caller changes.
- No rework of unrelated i18n keys.

## Decisions

**D1 — Reason values stay exactly as they are today, just typed.**
`WatchModeStopReason = "manual stop" | "restarting" | "note closed" | "note deleted" | "note moved"` — a union of the literal strings already in use, given a name. This keeps every existing `logger.info(...)` call and its test assertions (e.g. `reason: "note deleted"`) unchanged, while giving `stop()` a closed, checkable parameter instead of an untyped string.
*Alternative considered:* recase reasons as identifiers (`noteDeleted`, `manualStop`) for a more "code-like" feel. Rejected — it would touch every existing log-assertion test for no behavioral benefit, and the current phrases already read fine in a console log.

**D2 — One `Record<WatchModeStopReason, TranslationKey>` maps reason → i18n key.**
```ts
const STOP_REASON_KEYS: Record<WatchModeStopReason, TranslationKey> = {
  "manual stop": "notice.stop_reason.manual",
  "restarting": "notice.stop_reason.restarting",
  "note closed": "notice.stop_reason.note_closed",
  "note deleted": "notice.stop_reason.note_deleted",
  "note moved": "notice.stop_reason.note_moved",
};
```
Because the map is typed `Record<WatchModeStopReason, ...>`, adding a new reason value without adding its map entry is a compile error — the same pattern `scopeLabel()` already uses via `CONTENT_TYPE_SCOPE_OPTIONS.find(...)!`. The English values for each `notice.stop_reason.*` key are set to the exact current phrase ("note closed", "note deleted", "note moved", "manual stop", "restarting"), so the rendered English notice text is byte-identical to today's — only fr/es/ar actually change.
*Alternative considered:* one flat translation key per (event × reason) pair (`notice.stopped_note_closed`, ...). Rejected as more keys to keep in sync across 4 locales for the same information already expressible as a template + interpolated reason, matching how `statusbar.running` already composes three interpolated parts.

**D3 — Merge `stop()`/`stopWithNotice()` into one `stop()`.**
`stop(reason: WatchModeStopReason = "manual stop")` calls `host.notice(t("notice.stopped", { reason: t(STOP_REASON_KEYS[reason]) }))` unconditionally whenever it actually transitions from running to stopped (the existing `if (!this.isRunning) return;` guard still makes the not-running case a true no-op — no notice, no status change, matching the current "Stop when not running" spec scenario). `stopWithNotice` is deleted; `checkStillOpen`/`checkDeleted`/`checkRenamed` call `this.stop(reason)` directly, same as the manual-stop command callback and the restart path already do.

**D4 — Start notice reuses `start()`'s existing computed values.**
`scopeLabel(scope)`, `format.name`, and `target.basename` are already computed in `start()` for `onStatusChange` and the `logger.info` call. The new `host.notice(t("notice.started", { target: target.basename, scope: scopeLabel(scope), format: format.name }))` reuses the same three values — the notice and the status bar can never disagree about what session just started.

## Risks / Trade-offs

- **[Risk]** Existing spec scenarios ("Requirement: Stop watch mode command") and `watchModeController.spec.ts` assume manual stop is silent. → **Mitigation:** update both the delta spec (this change) and the two tests that would otherwise go stale (`"reports stopped state on stop..."` gets a notice assertion added; `"stop() is a safe no-op when not running"` gets an explicit `expect(notice).not.toHaveBeenCalled()`).
- **[Risk]** A locale missing one of the new keys would silently fall back to English inside `translate()` at runtime. → **Mitigation:** `i18n.spec.ts`'s locale-completeness suite already iterates every key in `en.json` against every other locale and fails on any empty/missing value — adding the new keys to `en.json` first and running tests will surface any locale left behind before merge.
- **[Trade-off]** Restarting (running "Start watch mode" while already watching) now shows a "stopped — restarting" notice immediately followed by a "started" notice for the new session — two notices for one user action. Accepted: consistency (every stop notices, no call-site exceptions to remember) was chosen over minimizing notice count for this one case.

## Migration Plan

None — no persisted data shape changes, no settings added or removed.
