## Context

`obsidian-hotkeys-cheatsheet` (a sibling plugin project) already solved this exact problem: a pure, unit-tested i18n module at `src/ts/i18n/i18n.ts` with per-locale JSON files, per-key English fallback, `{{var}}` interpolation, locale detection via Obsidian's `moment`, and RTL support. Per this project's CLAUDE.md, core logic must stay out of `obsidian`-importing modules and be unit-testable without mocking Obsidian's App/DOM — the reference module already satisfies this (it only reads `window.moment`/`navigator.language` behind a guard, no `obsidian` import). This change ports that module verbatim (module structure, function names, fallback semantics) and adapts only the locale set and call sites to this project.

This plugin currently has no sorting of user-visible strings and no existing translation infrastructure, so this is greenfield within the project but not greenfield in design — the job is to catalog every hardcoded string (done in the proposal) and route each through `t()`.

## Goals / Non-Goals

**Goals:**
- Reuse the reference project's `i18n.ts` architecture and its dynamic locale-completeness test as-is (function names, fallback behavior, file layout), not a reimplementation.
- Cover all current user-facing strings: commands, notice, status bar, settings tab (all four sections), both modals, and the two dropdown option label sets.
- Support `en` (default/fallback), `fr`, `es`, `ar` (RTL), matching the reference project's proven locale-detection and fallback behavior.
- Apply correct `dir` to both modals and the settings tab so Arabic reads right-to-left.

**Non-Goals:**
- `compareStrings` (locale-aware sort comparator): this plugin does not sort any user-visible strings anywhere (format list order is user-controlled via move up/down, not alphabetical; dropdown option order is fixed). Porting it now would be dead code. If a future feature needs alphabetical sorting of translated labels, it can be copied in then from the same reference module.
- `ja` (Japanese) locale: not requested; the reference project's `ja.json` is not ported.
- Persisting a user-chosen locale override: locale is always derived live from Obsidian's configured language (via `moment.locale()`), matching the reference project. No settings-tab language picker.
- Translating plugin-controlled data the user creates themselves (custom text-format names/templates the user types) — only the plugin's own UI chrome is translated, exactly as the reference project only translates curated categories, not third-party plugin names.

## Decisions

**Copy `i18n.ts` structure verbatim, trim to this project's locale set.** `translate`/`t`/`locale`/`isRtl` are ported unchanged in behavior; `detectLocale`'s `locales` registry only lists `en`/`fr`/`es`/`ar`. `compareStrings` is omitted per the Non-Goals above — if reinstated later, copy it back from the reference `i18n.ts` rather than rewriting it.

**Translation keys use the reference project's dot-namespace convention**, scoped to where the string is used, not to the OpenSpec capability name (capabilities are a planning construct; key namespaces should read naturally to a translator). Concretely:
- `command.start_watch`, `command.start_watch_choose_settings`, `command.stop_watch`
- `notice.no_active_file`
- `statusbar.running` (`"Clipboard Monitor: {{target}} — {{scope}} — {{format}}"`), `statusbar.idle`
- `settings.polling.heading`, `settings.polling.desc`, `settings.polling.tip`, `settings.polling.label`, `settings.polling.fast` / `.moderate` / `.slow`
- `settings.images.heading`, `settings.images.clear_after_insert.label`, `.desc`
- `settings.formats.heading`, `.desc`, `.name_placeholder`, `.template_placeholder`, `.add_button`, `.reset_button`, `.move_up`, `.move_down`, `.delete`, `.reset_confirm_title`, `.reset_confirm_message`, `.delete_confirm_title`, `.delete_confirm_message` (interpolates `{{name}}`)
- `settings.debug.heading`, `.label`, `.desc`
- `modal.watch.title`, `.target_label`, `.content_type_label`, `.text_format_label`, `.watch_button`
- `content_type.text_only`, `.images_only`, `.both`
- `common.cancel`, `common.delete_confirm` (the destructive confirm button text is supplied per-call by callers today — keep that pattern, but source the strings passed in from `t()` at the call site rather than hardcoding a new generic key)

This mixes naming by UI area (`settings.polling.*`) rather than by capability (`polling-frequency.*`) since a translator/reviewer of `en.json` should be able to tell where a string appears without cross-referencing OpenSpec; the proposal's "Modified Capabilities" mapping is a planning-time concern only and doesn't need to be mirrored in the key names.

**`localization` owns `ConfirmModal`'s own "Cancel" button**, since `ConfirmModal` is shared chrome, not owned by any single capability. `title`/`message`/`confirmText` continue to be supplied by the caller (as today) — but callers now pass already-translated strings (e.g. `text-formats`'s reset/delete flows translate their own confirmation copy and pass it in).

**RTL application**: mirror the reference project's `modalEl.setAttribute("dir", isRtl(locale()) ? "rtl" : "ltr")` pattern in both `ConfirmModal.onOpen()` and `WatchModeSettingsModal.onOpen()` (set on `this.modalEl`), and apply the same to the settings tab's `containerEl` in `ClipboardMonitorSettingTab.display()`. No CSS logical-property audit is in scope this round since the current layouts are simple vertical `Setting` rows with no fixed left/right positioning to mirror (unlike the reference project's dropdown-anchoring and chevron-mirroring concerns, which don't apply here — this plugin has no dropdown menus positioned off a trigger button, and no directional glyphs).

**Locale detection stays live, not cached/persisted** — each `t()` call re-detects via `moment.locale()`. This matches the reference project and avoids stale translations if the user changes Obsidian's language without reloading the plugin (`main.ts`'s status bar re-renders on every status change anyway, and the settings tab re-detects on every `display()` call).

## Risks / Trade-offs

- [Machine/manual translation quality for fr/es/ar may contain errors] → Mitigation: keep `en.json` as the single source of truth key set (enforced by the completeness test), so a native speaker can later correct individual values without any code change.
- [Bidi rendering of interpolated Latin content (e.g. a user's custom format name) inside an Arabic confirm message] → Mitigation: out of scope for this change (the reference project only isolates bidi for its own key-badge glyphs, a concern this plugin doesn't have); revisit only if real garbling is reported.
- [Status bar / notice strings are read by both TypeScript and, indirectly, by users glancing at the UI — a missed call site would silently stay in English] → Mitigation: the string catalog in the proposal is exhaustive per current `grep` of every `.setText`/`.setName`/`.setButtonText`/`.setTooltip`/`.setPlaceholder`/`new Notice`/template-literal call; tasks.md will check off each file individually.

## Open Questions

None outstanding — locale set, key convention, RTL scope, and `compareStrings` exclusion are decided above.
