## ADDED Requirements

### Requirement: Polling frequency setting

The system SHALL provide a "Polling frequency" plugin setting with exactly
three selectable options — Fast, Moderate, and Slow — displayed to the user
as labels only, with no numeric millisecond values shown in the settings
UI. The setting SHALL default to Moderate when no value has been persisted
yet.

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

### Requirement: Settings description explains performance impact and polling rationale

The settings tab SHALL display a description block near the polling
frequency control explaining that faster polling detects clipboard changes
sooner at a higher CPU/battery cost, that slower polling is lighter but
detects changes with more delay, and that the plugin polls at all because
Obsidian (via Electron) does not expose a clipboard-change event.

#### Scenario: Description block is visible

- **WHEN** the user opens the settings tab
- **THEN** a description block is shown alongside the polling frequency
  control covering the performance trade-off of the setting and the reason
  polling is used instead of an event-based approach

### Requirement: Setting change does not affect an already-running watch session

Changing the polling frequency setting SHALL take effect only for watch
sessions started after the change. A watch session that is already running
at the time the setting is changed SHALL continue polling at the interval
that was in effect when it started, until it is stopped.

#### Scenario: Changing the setting while a watch session is running

- **WHEN** a watch session is started with the Moderate frequency, and the
  user then changes the setting to Fast while that session is still running
- **THEN** the running session continues polling at the Moderate interval

#### Scenario: Setting change applies to the next session

- **WHEN** a watch session is started with the Moderate frequency, the user
  changes the setting to Fast, the session is stopped, and a new watch
  session is then started
- **THEN** the new session polls at the Fast interval
