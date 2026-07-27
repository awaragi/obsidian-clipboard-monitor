## Why

Every user-facing string in the plugin (commands, notices, status bar, settings tab, and modals) is hardcoded in English, so non-English-speaking users get an untranslated UI even when Obsidian itself is configured in their language. The sibling project `obsidian-hotkeys-cheatsheet` already has a proven, pure, unit-testable i18n architecture (locale detection via `moment.locale()`, per-key English fallback, RTL support) — this change copies that architecture rather than designing a new one from scratch, then wires every existing string in this plugin through it.

## What Changes

- Add a new `localization` capability: a pure `i18n` module (`t`, `translate`, `locale`, `isRtl`) copied from `obsidian-hotkeys-cheatsheet/src/ts/i18n/i18n.ts`, adapted to this project's locale set (no `ja`) and import structure.
- Add locale JSON files for English (`en`, canonical/fallback), French (`fr`), Spanish (`es`), and Arabic (`ar`).
- Add a unit test that dynamically verifies every non-English locale has a non-empty translation for every key in `en.json` (no hardcoded key/locale lists), mirroring the reference project's completeness test.
- Apply `dir="rtl"`/`dir="ltr"` to the plugin's modals (`ConfirmModal`, `WatchModeSettingsModal`) and the settings tab root based on the active locale, so Arabic renders right-to-left.
- Replace every hardcoded user-facing string across `main.ts`, the settings tab, both modals, and the polling-frequency/content-type-scope option labels with `t()` lookups.
- **BREAKING**: none — this is additive; English behavior and default output are unchanged when the detected locale is `en` or unregistered.

## Capabilities

### New Capabilities
- `localization`: Locale detection (via `moment.locale()`/`navigator.language`), per-key-fallback translation lookup with `{{var}}` interpolation, RTL detection, and application of `dir` to the plugin's modals and settings tab. Owns the translation-key catalog and the shared `ConfirmModal` chrome (its own hardcoded "Cancel" button).

### Modified Capabilities
- `watch-mode-core`: command names, the "open a note to start watch mode" notice, and the status bar text (running and idle) are now sourced from translations.
- `watch-settings-modal`: modal title, field labels ("Target", "Content type", "Text format"), and button labels ("Watch", "Cancel") are now translated; modal sets `dir` per the active locale.
- `polling-frequency`: the "Polling frequency" setting name, its dropdown option labels (Fast/Moderate/Slow), and its explanatory description text are now translated.
- `content-type-scope`: the dropdown option labels ("Text only", "Images only", "Both") are now translated.
- `text-formats`: the settings tab's "Text formats" section (heading, description, placeholders, Add/Reset buttons, per-row move/delete tooltips) and its reset/delete confirmation dialogs (title, message, confirm button) are now translated.
- `images`: the "Clear clipboard after image insert" setting name and description are now translated.
- `debug-logging`: the "Debug logging" setting name and description are now translated.

## Impact

- New files: `src/ts/i18n/i18n.ts`, `src/ts/i18n/i18n.spec.ts`, `src/ts/i18n/locales/{en,fr,es,ar}.json`.
- Modified files: `src/ts/main.ts`, `src/ts/settings/clipboardMonitorSettingTab.ts`, `src/ts/settings/confirmModal.ts`, `src/ts/watchMode/watchModeSettingsModal.ts`, `src/ts/watchMode/pollingFrequency.ts`, `src/ts/watchMode/contentTypeScope.ts`.
- No new runtime dependencies (relies on Obsidian's global `moment`, already available at runtime, and browser `Intl`/`navigator`).
- No data migration: `ClipboardMonitorData` is unaffected; locale is detected live, not persisted.
