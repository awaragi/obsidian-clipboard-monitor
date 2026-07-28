## Context

The `localization` capability's architecture (locale detection, per-key English fallback, dynamically-derived completeness test) was designed to make adding a locale a data-only change: drop in a JSON file, register it, done. This change exercises that path for Japanese, which was deliberately left out of the original localization rollout.

## Goals / Non-Goals

**Goals:**
- Ship a complete, natural Japanese translation for every key in `en.json`.
- Register `ja` so it's picked up by Obsidian's language setting / browser locale like the other three locales.

**Non-Goals:**
- No changes to the i18n module's detection, fallback, or interpolation logic.
- No new RTL handling — Japanese is LTR, same code path as `en`/`fr`/`es`.
- No test-file changes — `i18n.spec.ts` already iterates `Object.keys(locales)` and `Object.keys(en)` generically.

## Decisions

- **Locale code `ja`, not a regional variant**: matches `moment.locale()`'s base-language reduction (`ja-JP` → `ja`) and the existing pattern for `en`/`fr`/`es`/`ar`.
- **No new RTL entry**: `RTL_LOCALES` stays `Set(["ar"])`; Japanese renders LTR like English/French/Spanish.
- **Translate, don't transliterate, UI chrome**: button/label/heading strings use natural Japanese phrasing (e.g. "リセット" for "Reset") rather than literal word-for-word translation, matching how `fr`/`es`/`ar` were done.

## Risks / Trade-offs

- [Risk] Translation quality can't be verified by a native speaker in this workflow → Mitigation: keep translations literal/conservative for technical terms (e.g. "クリップボード" for "clipboard") and rely on the completeness test to at least guarantee no missing/empty keys.
