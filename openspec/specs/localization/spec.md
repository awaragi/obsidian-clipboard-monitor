# localization Specification

## Purpose
Detects the active Obsidian locale, resolves translated strings with per-key English fallback, and exposes RTL/LTR direction for layout — shared by the settings tab and the plugin's modals.

## Requirements

### Requirement: Locale is detected from Obsidian's configured language
The plugin SHALL detect the active locale by reading `moment.locale()` (which mirrors Obsidian's configured interface language), falling back to `navigator.language` when unavailable. The detected value SHALL be reduced to its base language subtag (e.g. `en-US` → `en`) before being matched against registered locales. If the reduced code has no matching entry in the registered locales, the locale SHALL fall back to `en`.

#### Scenario: Obsidian language drives detection
- **WHEN** Obsidian's interface language is set to French
- **THEN** the plugin's `locale()` returns `"fr"`

#### Scenario: Unregistered locale falls back to English
- **WHEN** the detected locale code has no matching entry in the registered locales
- **THEN** all translated strings render in English

### Requirement: Translation lookup falls back to English per-key
Each translated string SHALL be looked up in the active locale's translation object; if the key is missing (undefined/null) in that locale, the English value SHALL be used instead. `{{var}}` placeholders in the resolved string SHALL be replaced with corresponding values from a supplied variables map.

#### Scenario: Missing key falls back to English
- **WHEN** a locale's translation object omits a key present in `en.json`
- **THEN** looking up that key returns the English string, not an empty or undefined value

#### Scenario: Placeholder interpolation
- **WHEN** a translated string contains `{{name}}` and a vars map of `{ name: "Meeting Notes" }` is supplied
- **THEN** the resolved string has `{{name}}` replaced with `Meeting Notes`

### Requirement: French, Spanish, Arabic, and Japanese locales are registered with complete translations
`fr.json` (French), `es.json` (Spanish), `ar.json` (Arabic), and `ja.json` (Japanese) SHALL be registered in the locale map alongside `en` (the default/fallback), each providing a non-empty translation for every key present in `en.json`.

#### Scenario: French locale resolves a settings label
- **WHEN** the active locale is `fr`
- **THEN** `settings.polling.label` resolves to the French translation, not the English fallback

#### Scenario: Spanish locale resolves a settings label
- **WHEN** the active locale is `es`
- **THEN** `settings.polling.label` resolves to the Spanish translation, not the English fallback

#### Scenario: Arabic locale resolves a settings label
- **WHEN** the active locale is `ar`
- **THEN** `settings.polling.label` resolves to the Arabic translation, not the English fallback

#### Scenario: Japanese locale resolves a settings label
- **WHEN** the active locale is `ja`
- **THEN** `settings.polling.label` resolves to the Japanese translation, not the English fallback

### Requirement: Locale completeness is verified without hardcoded key or locale lists
A test SHALL verify, for every registered locale other than `en`, that every key present in `en.json` exists in that locale as a non-empty string. The test SHALL derive both the set of required keys and the set of locales to check dynamically (from `Object.keys` of the English translations object and from the registered locales map, respectively), so that adding a new key to `en.json` or a new locale to the locale map does not require any change to the test itself.

#### Scenario: Test fails on a missing key
- **WHEN** a non-English locale is missing a key that exists in `en.json`
- **THEN** the completeness test fails, identifying the locale and the missing key

#### Scenario: Test fails on an empty-string value
- **WHEN** a non-English locale has a key present but set to an empty string
- **THEN** the completeness test fails, identifying the locale and the key

#### Scenario: Test requires no changes when a new key is added
- **WHEN** a new key is added to `en.json` and translated in every registered locale
- **THEN** the completeness test passes without any modification to the test file itself

### Requirement: RTL locales are identified for layout purposes
The plugin SHALL expose whether the active locale is right-to-left, used to drive `dir` attributes in the modals and settings tab.

#### Scenario: Arabic is identified as RTL
- **WHEN** the active locale is `ar`
- **THEN** the plugin reports the active locale as right-to-left

#### Scenario: English, French, Spanish, and Japanese are identified as LTR
- **WHEN** the active locale is `en`, `fr`, `es`, or `ja`
- **THEN** the plugin reports the active locale as left-to-right

### Requirement: The shared confirmation modal and the settings tab set direction from the active locale
The destructive-action confirmation modal (shared chrome used by multiple capabilities, not owned by any single one) and the plugin's settings tab root SHALL set a `dir` attribute reflecting whether the active locale is right-to-left or left-to-right. A capability-owned modal (e.g. the watch-settings modal) sets its own direction as part of that capability's own spec.

#### Scenario: Confirmation modal sets RTL direction under an RTL locale
- **WHEN** the active locale is `ar` and any capability opens the confirmation modal
- **THEN** the modal's root element has `dir="rtl"`

#### Scenario: Confirmation modal sets LTR direction under an LTR locale
- **WHEN** the active locale is `en`, `fr`, or `es` and any capability opens the confirmation modal
- **THEN** the modal's root element has `dir="ltr"`

#### Scenario: Settings tab sets direction to match the active locale
- **WHEN** the active locale is `ar` and the user opens the plugin's settings tab
- **THEN** the settings tab's root container has `dir="rtl"`

### Requirement: Shared confirmation-modal chrome is translated
The destructive-action confirmation modal's own built-in "Cancel" button SHALL be translated; its title, message, and confirm-button text remain supplied by the calling capability, which SHALL supply already-translated strings.

#### Scenario: Confirmation modal's Cancel button is translated
- **WHEN** the active locale is `fr` and any capability opens the confirmation modal
- **THEN** the modal's "Cancel" button reads the French translation
