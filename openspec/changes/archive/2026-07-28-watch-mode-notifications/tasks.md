## 1. Localization

- [x] 1.1 Add `notice.started` (template with `{{target}}`, `{{scope}}`, `{{format}}`) to `src/ts/i18n/locales/en.json`
- [x] 1.2 Add `notice.stopped` (template with `{{reason}}`) to `en.json`
- [x] 1.3 Add `notice.stop_reason.manual`, `notice.stop_reason.restarting`, `notice.stop_reason.note_closed`, `notice.stop_reason.note_deleted`, `notice.stop_reason.note_moved` to `en.json`, matching the current English reason phrases exactly ("manual stop", "restarting", "note closed", "note deleted", "note moved")
- [x] 1.4 Add translated values for all six new keys to `fr.json`, `es.json`, and `ar.json`

## 2. WatchModeController

- [x] 2.1 Add `WatchModeStopReason` union type (`"manual stop" | "restarting" | "note closed" | "note deleted" | "note moved"`) and type `stop()`'s `reason` parameter with it
- [x] 2.2 Add the `STOP_REASON_KEYS: Record<WatchModeStopReason, TranslationKey>` map
- [x] 2.3 Merge `stopWithNotice()` into `stop()`: after the existing `if (!this.isRunning) return;` guard, call `this.host.notice(t("notice.stopped", { reason: t(STOP_REASON_KEYS[reason]) }))`; delete `stopWithNotice()`
- [x] 2.4 Update `checkStillOpen`/`checkDeleted`/`checkRenamed` to call `this.stop(reason)` directly instead of `this.stopWithNotice(reason)`
- [x] 2.5 In `start()`, add `this.host.notice(t("notice.started", { target: target.basename, scope: scopeLabel(scope), format: format.name }))`, reusing the same values already computed for `onStatusChange`/`logger.info`

## 3. Update existing tests

- [x] 3.1 `watchModeController.spec.ts`: `"reports stopped state on stop and unregisters listeners"` — assert the manual-stop `Notice` is now shown
- [x] 3.2 `watchModeController.spec.ts`: `"stop() is a safe no-op when not running"` — assert `notice` was NOT called (not just `onStatusChange`)
- [x] 3.3 Add a test asserting `start()` shows a `Notice` containing target/scope/format
- [x] 3.4 Add a test asserting restarting (start while already running) shows both the "restarting" stop notice and the new session's start notice, in that order
- [x] 3.5 Re-run existing `notice`-asserting tests (`"auto-stops with a notice..."` ×3) and confirm they still pass unchanged (English reason phrasing is preserved by design) — also fixed two previously-passing tests (`"does not stop on layout-change..."`, `"ignores deletion of an unrelated file"`) that asserted `notice` was never called; they now clear the mock after `start()` since a start notice is expected, and assert no *additional* notice fires from the no-op check.

## 4. Verify

- [x] 4.1 `npm run typecheck`
- [x] 4.2 `npm run lint`
- [x] 4.3 `npm test` (includes `i18n.spec.ts` locale-completeness check for the new keys) — 283/283 passing
