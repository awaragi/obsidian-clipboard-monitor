# ribbon-icon Specification

## Purpose
Provides a ribbon icon shortcut to the watch-mode settings picker, and a settings-tab toggle controlling whether that icon is registered.

## Requirements

### Requirement: Ribbon icon opens the watch-mode settings picker
When enabled, the system SHALL register a ribbon icon in Obsidian's left sidebar that, when clicked, invokes the same behavior as the "Start watch mode (choose settings)" command, regardless of whether watch mode is currently running.

#### Scenario: Clicking the ribbon icon while stopped
- **WHEN** watch mode is stopped and the user clicks the ribbon icon
- **THEN** the watch-mode settings modal opens for the active note, identical to running "Start watch mode (choose settings)"

#### Scenario: Clicking the ribbon icon while running
- **WHEN** watch mode is running and the user clicks the ribbon icon
- **THEN** the watch-mode settings modal opens, and confirming new settings in the modal restarts watch mode with those settings, while cancelling the modal leaves the currently running session untouched

### Requirement: Ribbon icon visibility setting
The system SHALL provide a "Show ribbon icon" setting, defaulting to enabled, that controls whether the ribbon icon is registered. Changes to this setting SHALL take effect the next time the plugin loads (e.g. after disabling/re-enabling the plugin or restarting Obsidian), not immediately.

#### Scenario: Ribbon icon shown by default
- **WHEN** the plugin is installed with no prior saved settings
- **THEN** the ribbon icon is visible in the left sidebar

#### Scenario: Disabling the setting hides the icon after reload
- **WHEN** the user turns off "Show ribbon icon" and then reloads the plugin
- **THEN** the ribbon icon is no longer registered

#### Scenario: Setting label and description are translated
- **WHEN** the active locale is `ar` and the user opens the plugin's settings tab
- **THEN** the "Show ribbon icon" setting's label and description render using the Arabic translation
