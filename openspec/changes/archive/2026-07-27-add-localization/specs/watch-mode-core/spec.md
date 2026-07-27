## MODIFIED Requirements

### Requirement: Start watch mode pins the active note
The "Start watch mode" command SHALL, when invoked, immediately pin the
currently active note as the watch target and begin polling, without
prompting the user for any input. When no active note is available, the
`Notice` explaining that an active note is required SHALL be shown in the
active locale.

#### Scenario: Starting watch mode with an active note
- **WHEN** the user runs "Start watch mode" while a markdown note is the
  active file
- **THEN** that note becomes the watch target and clipboard polling begins
  immediately

#### Scenario: Starting watch mode with no active note
- **WHEN** the user runs "Start watch mode" while no markdown note is
  active
- **THEN** the command does not start watch mode and shows a `Notice`
  explaining that an active note is required

#### Scenario: No-active-note notice is translated
- **WHEN** the active locale is `es` and the user runs "Start watch mode"
  with no active note
- **THEN** the `Notice` text is shown in Spanish, not English

### Requirement: Status bar indicator
The system SHALL display a status bar item reflecting whether watch mode
is currently running and, when running, the pinned target note's name.
The surrounding status bar text (the "Clipboard Monitor:" label and the
off-state text) SHALL be shown in the active locale; the target note's
name itself is never translated (it is user content, not plugin chrome).

#### Scenario: Status bar reflects running state
- **WHEN** watch mode is started with a note named "Meeting Notes"
- **THEN** the status bar item displays that watch mode is on and shows
  "Meeting Notes" as the target

#### Scenario: Status bar reflects stopped state
- **WHEN** watch mode is stopped (manually or automatically)
- **THEN** the status bar item updates to reflect the off state

#### Scenario: Status bar chrome is translated
- **WHEN** the active locale is `ar` and watch mode is running
- **THEN** the status bar's surrounding text (label and separators aside
  from the note name, scope, and format) renders using the Arabic
  translation

## ADDED Requirements

### Requirement: Command palette entries are translated
The "Start watch mode", "Start watch mode (choose settings)", and "Stop watch mode" command palette entries SHALL display their name in the active locale.

#### Scenario: Command names appear in the active locale
- **WHEN** the active locale is `fr` and the user opens the command
  palette
- **THEN** the three watch-mode commands appear with their French names
