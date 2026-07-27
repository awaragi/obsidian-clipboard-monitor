## 1. Port the i18n module from obsidian-hotkeys-cheatsheet

- [x] 1.1 Copy `../obsidian-hotkeys-cheatsheet/src/ts/i18n/i18n.ts` into `src/ts/i18n/i18n.ts`, trimming the `locales` registry to `{ en, fr, es, ar }` (drop `ja`) and dropping `compareStrings` (not needed — see design.md Non-Goals).
- [x] 1.2 Copy `../obsidian-hotkeys-cheatsheet/src/ts/i18n/i18n.spec.ts` into `src/ts/i18n/i18n.spec.ts`, adjusting for the trimmed locale set and this project's test conventions (no `vi.mock`, per CLAUDE.md).
- [x] 1.3 Create `src/ts/i18n/locales/en.json` with the full key catalog from the "Decisions" section of design.md (commands, notice, status bar, all four settings sections, both modals, both dropdown option sets, shared confirm-modal chrome).
- [x] 1.4 Create `src/ts/i18n/locales/fr.json`, `src/ts/i18n/locales/es.json`, and `src/ts/i18n/locales/ar.json` with complete, non-empty translations for every key in `en.json`.
- [x] 1.5 Run the completeness spec test and confirm it passes for all three non-English locales.

## 2. Translate main.ts (commands, notice, status bar)

- [x] 2.1 Replace the three `addCommand` `name` fields with `t("command.start_watch")`, `t("command.start_watch_choose_settings")`, `t("command.stop_watch")`.
- [x] 2.2 Replace the `new Notice(...)` string in `getActiveFileOrNotice` with `t("notice.no_active_file")`.
- [x] 2.3 Replace the `renderStatus` template literal with `t()` calls for the running/idle chrome (`statusbar.running` / `statusbar.idle`), keeping `status.targetName`, `status.scopeLabel`, and `status.formatLabel` interpolated as-is (user/derived content, not translated as literal strings themselves).

## 3. Translate the settings tab

- [x] 3.1 In `src/ts/settings/clipboardMonitorSettingTab.ts`, set `dir` on `containerEl` at the top of `display()` based on `isRtl(locale())`.
- [x] 3.2 Replace the "Polling" heading, its two description paragraphs, and the "Polling frequency" setting name with `t()` calls; translate `POLLING_FREQUENCY_OPTIONS` labels in `src/ts/watchMode/pollingFrequency.ts` via `t()` at the point they're consumed (or store translation keys and resolve at render time — decide based on how `option.label` is consumed by the dropdown, since the array itself is a static module-level constant evaluated before a locale is known at import time).
- [x] 3.3 Replace the "Images" heading, its description paragraph, and the "Clear clipboard after image insert" setting name with `t()` calls.
- [x] 3.4 Replace the "Text formats" heading, its description paragraph, the "Name"/template placeholders, the "Add"/"Reset to defaults" button labels, and the per-row "Move up"/"Move down"/"Delete" tooltips with `t()` calls.
- [x] 3.5 Replace the "Debugging" heading, its description paragraph, and the "Debug logging" setting name with `t()` calls.
- [x] 3.6 Update the "Reset to defaults?" `ConfirmModal` call site to pass translated title/message/confirm-button text (`t("settings.formats.reset_confirm_title")`, etc.).
- [x] 3.7 Update the "Delete format?" `ConfirmModal` call site to pass translated title/confirm-button text and a translated message with `{{name}}` interpolated via `t("settings.formats.delete_confirm_message", { name: format.name })`.

## 4. Translate ConfirmModal and apply RTL

- [x] 4.1 In `src/ts/settings/confirmModal.ts`, replace the hardcoded `"Cancel"` button text with `t("common.cancel")`.
- [x] 4.2 Set `dir` on `this.modalEl` in `onOpen()` based on `isRtl(locale())`.

## 5. Translate WatchModeSettingsModal and apply RTL

- [x] 5.1 In `src/ts/watchMode/watchModeSettingsModal.ts`, replace the modal title, "Target"/"Content type"/"Text format" labels, and "Watch"/"Cancel" button text with `t()` calls.
- [x] 5.2 Set `dir` on `this.modalEl` in `onOpen()` based on `isRtl(locale())`.
- [x] 5.3 Translate `CONTENT_TYPE_SCOPE_OPTIONS` labels in `src/ts/watchMode/contentTypeScope.ts` at the point they're consumed (same constant-evaluation-order consideration as task 3.2).

## 6. Translate the status-bar scope/format labels

- [x] 6.1 In `src/ts/watchMode/watchModeController.ts`, translate the `scopeLabel()` helper's returned string (feeding `content-type-scope`'s "Status bar shows the active content-type scope" requirement) so the status bar's scope indication is locale-aware.

## 7. Verify

- [x] 7.1 Run the full unit test suite and confirm no regressions.
- [x] 7.2 Manually load the plugin in a test vault with Obsidian's language set to French, Spanish, and Arabic in turn, and confirm the settings tab, both modals, the status bar, and the command palette all render translated text, with Arabic showing right-to-left layout.
- [x] 7.3 Confirm English (and an unregistered locale, e.g. German) still renders the original English strings unchanged.
