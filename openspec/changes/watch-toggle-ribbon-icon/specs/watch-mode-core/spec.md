## ADDED Requirements

### Requirement: Toggle watch mode command
The "Toggle watch mode" command SHALL, when invoked, stop watch mode if it is currently running, or start it if it is not currently running. Starting via this command SHALL use the same active-note and last-used scope/format resolution as the "Start watch mode" command, including showing the no-active-note `Notice` when no active note is available.

#### Scenario: Toggling on from stopped state
- **WHEN** watch mode is stopped and the user runs "Toggle watch mode" with a markdown note active
- **THEN** that note becomes the watch target using the last-used scope and format, and clipboard polling begins immediately

#### Scenario: Toggling off from running state
- **WHEN** watch mode is running and the user runs "Toggle watch mode"
- **THEN** polling stops immediately and the status bar reflects the off state

#### Scenario: Toggling on with no active note
- **WHEN** watch mode is stopped and the user runs "Toggle watch mode" with no markdown note active
- **THEN** the command does not start watch mode and shows the same `Notice` as "Start watch mode" explaining that an active note is required

## MODIFIED Requirements

### Requirement: Command palette entries are translated
The "Start watch mode", "Start watch mode (choose settings)", "Stop watch mode", and "Toggle watch mode" command palette entries SHALL display their name in the active locale.

#### Scenario: Command names appear in the active locale
- **WHEN** the active locale is `fr` and the user opens the command
  palette
- **THEN** the four watch-mode commands appear with their French names
