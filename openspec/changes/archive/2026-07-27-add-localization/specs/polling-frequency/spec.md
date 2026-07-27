## MODIFIED Requirements

### Requirement: Polling frequency setting

The system SHALL provide a "Polling frequency" plugin setting with exactly
three selectable options — Fast, Moderate, and Slow — displayed to the user
as labels only, with no numeric millisecond values shown in the settings
UI. The setting SHALL default to Moderate when no value has been persisted
yet. The setting's name and its three option labels SHALL be shown in the
active locale; the persisted value (`"fast"` / `"moderate"` / `"slow"`) is
unaffected by locale.

#### Scenario: Default value on first load

- **WHEN** the plugin loads and no polling frequency has previously been
  saved
- **THEN** the effective polling frequency is Moderate

#### Scenario: Setting persists across reloads

- **WHEN** the user selects Fast in the settings tab
- **THEN** the choice is persisted, and after the plugin reloads the
  settings tab still shows Fast selected

#### Scenario: Only three options are offered

- **WHEN** the user opens the polling frequency control in the settings tab
- **THEN** exactly three options are shown — Fast, Moderate, Slow — with no
  numeric values displayed

#### Scenario: Setting name and options are translated
- **WHEN** the active locale is `ar` and the user opens the settings tab
- **THEN** the "Polling frequency" setting name and its Fast/Moderate/Slow
  option labels render using the Arabic translation

### Requirement: Settings description explains performance impact and polling rationale

The settings tab SHALL display a description block near the polling
frequency control explaining that faster polling detects clipboard changes
sooner at a higher CPU/battery cost, that slower polling is lighter but
detects changes with more delay, and that the plugin polls at all because
Obsidian (via Electron) does not expose a clipboard-change event. This
description block SHALL be shown in the active locale.

#### Scenario: Description block is visible

- **WHEN** the user opens the settings tab
- **THEN** a description block is shown alongside the polling frequency
  control covering the performance trade-off of the setting and the reason
  polling is used instead of an event-based approach

#### Scenario: Description block is translated
- **WHEN** the active locale is `fr` and the user opens the settings tab
- **THEN** the description block renders in French
