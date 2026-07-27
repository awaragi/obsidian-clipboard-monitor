## MODIFIED Requirements

### Requirement: Debug Logging Setting
The plugin SHALL persist a single boolean setting, `debugLoggingEnabled`, defaulting to `false`, controllable from a toggle in the plugin's settings tab. The setting's name and description in the settings tab SHALL be shown in the active locale.

#### Scenario: Default state for a new install
- **WHEN** the plugin loads with no previously saved data
- **THEN** `debugLoggingEnabled` is `false`

#### Scenario: Setting persists across reloads
- **WHEN** a user enables the "Debug logging" toggle in settings and the plugin is later reloaded
- **THEN** `debugLoggingEnabled` loads as `true`

#### Scenario: Setting name and description are translated
- **WHEN** the active locale is `fr` and the user opens the settings tab
- **THEN** the "Debug logging" setting's name and description render in French
