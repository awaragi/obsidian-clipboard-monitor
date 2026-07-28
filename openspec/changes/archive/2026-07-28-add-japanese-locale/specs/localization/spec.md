## MODIFIED Requirements

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

### Requirement: RTL locales are identified for layout purposes
The plugin SHALL expose whether the active locale is right-to-left, used to drive `dir` attributes in the modals and settings tab.

#### Scenario: Arabic is identified as RTL
- **WHEN** the active locale is `ar`
- **THEN** the plugin reports the active locale as right-to-left

#### Scenario: English, French, Spanish, and Japanese are identified as LTR
- **WHEN** the active locale is `en`, `fr`, `es`, or `ja`
- **THEN** the plugin reports the active locale as left-to-right
