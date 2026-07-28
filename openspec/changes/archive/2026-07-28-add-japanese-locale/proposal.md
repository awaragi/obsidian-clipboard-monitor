## Why

The plugin's i18n system currently ships English, French, Spanish, and Arabic; Japanese was explicitly deferred when localization was first added (`openspec/changes/archive/2026-07-27-add-localization`). Japanese-language Obsidian users currently get an untranslated (English) UI even though the plugin's translation architecture already supports adding a locale with no code changes beyond registration.

## What Changes

- Add `src/ts/i18n/locales/ja.json` with a complete, non-empty translation for every key currently in `en.json`.
- Register `ja` in the `locales` map in `src/ts/i18n/i18n.ts` so it's detected via `moment.locale()`/`navigator.language` like the other locales.
- Treat Japanese as left-to-right: it is not added to `RTL_LOCALES`.
- No test code changes: the existing completeness spec (`src/ts/i18n/i18n.spec.ts`) already derives its locale list and required keys dynamically, so it verifies `ja` automatically once registered.
- **BREAKING**: none — additive only; behavior for existing locales and for unregistered locales is unchanged.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `localization`: the requirement that French, Spanish, and Arabic locales are registered with complete translations gains Japanese as a fourth registered locale; the LTR requirement's example locale list gains `ja`.

## Impact

- New file: `src/ts/i18n/locales/ja.json`.
- Modified file: `src/ts/i18n/i18n.ts` (add `ja` import and registry entry).
- No new runtime dependencies. No data migration.
