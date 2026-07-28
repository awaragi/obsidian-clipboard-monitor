## 1. Add the Japanese locale

- [x] 1.1 Create `src/ts/i18n/locales/ja.json` with a complete, non-empty, natural Japanese translation for every key in `en.json`.
- [x] 1.2 Register `ja` in `src/ts/i18n/i18n.ts`: import `ja.json` and add it to the `locales` map.

## 2. Verify

- [x] 2.1 Run the unit test suite and confirm the existing completeness spec (`src/ts/i18n/i18n.spec.ts`) passes for `ja` with no test-file changes.
- [x] 2.2 Confirm `isRtl("ja")` is `false` (no `RTL_LOCALES` change needed) and English/unregistered-locale behavior is unchanged.
