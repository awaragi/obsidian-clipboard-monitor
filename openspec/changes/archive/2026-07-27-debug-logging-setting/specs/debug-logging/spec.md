## ADDED Requirements

### Requirement: Debug Logging Setting
The plugin SHALL persist a single boolean setting, `debugLoggingEnabled`, defaulting to `false`, controllable from a toggle in the plugin's settings tab.

#### Scenario: Default state for a new install
- **WHEN** the plugin loads with no previously saved data
- **THEN** `debugLoggingEnabled` is `false`

#### Scenario: Setting persists across reloads
- **WHEN** a user enables the "Debug logging" toggle in settings and the plugin is later reloaded
- **THEN** `debugLoggingEnabled` loads as `true`

### Requirement: Master Switch Gates All Log Output
When `debugLoggingEnabled` is `false`, the plugin SHALL produce no debug or info console output. When `debugLoggingEnabled` is `true`, every debug and info log call site SHALL fire. There is no intermediate verbosity level.

#### Scenario: Logging disabled
- **WHEN** `debugLoggingEnabled` is `false` and watch mode is running (polling, detecting, and inserting clipboard content)
- **THEN** no `console.debug` or `console.info` calls occur as a result of watch-mode activity

#### Scenario: Logging enabled
- **WHEN** `debugLoggingEnabled` is `true` and watch mode is running
- **THEN** both debug-level (per-poll-tick) and info-level (lifecycle) log calls occur as watch-mode activity happens

### Requirement: Live Toggle Without Restart
Enabling or disabling debug logging SHALL take effect immediately for an in-progress watch-mode session, without requiring the user to stop and restart watch mode.

#### Scenario: Enabling mid-session
- **WHEN** watch mode is already running with `debugLoggingEnabled` set to `false`, and the user enables the setting from the settings tab
- **THEN** subsequent poll ticks and lifecycle events for that same running session produce log output, with no restart of watch mode

#### Scenario: Disabling mid-session
- **WHEN** watch mode is already running with `debugLoggingEnabled` set to `true`, and the user disables the setting
- **THEN** subsequent poll ticks and lifecycle events for that same running session produce no further log output

### Requirement: Two Level-Filterable Log Methods
The logging seam SHALL expose exactly two methods, `debug` and `info`, backed respectively by `console.debug` and `console.info`, so entries can be filtered independently using the host console's built-in log-level filters. The seam SHALL NOT expose an error or warning level; failures that need a user's attention continue to be surfaced via the plugin's existing `Notice`-based mechanisms, unaffected by this setting.

#### Scenario: Debug-level detail
- **WHEN** debug logging is enabled and a poll tick finds no new clipboard content, duplicate content, or newly detected content
- **THEN** the outcome is recorded via the `debug` method

#### Scenario: Info-level detail
- **WHEN** debug logging is enabled and watch mode starts, stops, inserts content, or saves an image attachment
- **THEN** the event is recorded via the `info` method

#### Scenario: Failures remain outside the logger
- **WHEN** a condition occurs that already surfaces a `Notice` to the user today (e.g. watch mode auto-stopping because the target note was closed, deleted, or renamed)
- **THEN** that `Notice` continues to display regardless of `debugLoggingEnabled`, and the logging seam is not the mechanism used to surface it
