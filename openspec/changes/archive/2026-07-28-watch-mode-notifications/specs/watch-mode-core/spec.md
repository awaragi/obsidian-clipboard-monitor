## MODIFIED Requirements

### Requirement: Start watch mode pins the active note
The "Start watch mode" command SHALL, when invoked, immediately pin the
currently active note as the watch target and begin polling, without
prompting the user for any input, and SHALL show a `Notice` confirming the
target note, the active content-type scope, and the active text format.
When no active note is available, the `Notice` explaining that an active
note is required SHALL be shown in the active locale. When invoked while a
session is already running, the previous session SHALL be stopped (per
the "Stop watch mode command" requirement's notice behavior, with a reason
indicating a new session is replacing it) before the new one starts.

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

#### Scenario: Starting watch mode shows a confirmation notice
- **WHEN** the user runs "Start watch mode" or "Start watch mode (choose
  settings)" while a markdown note is the active file
- **THEN** a `Notice` is shown stating the target note's name, the active
  content-type scope, and the active text format

#### Scenario: Start confirmation notice is translated
- **WHEN** the active locale is `fr` and the user starts watch mode
  successfully
- **THEN** the start confirmation `Notice` text is shown in French, not
  English

#### Scenario: Starting while already running notices the replaced session
- **WHEN** the user runs "Start watch mode" (or "...choose settings") while
  a session is already active
- **THEN** a `Notice` is shown stating the previous session was stopped
  because a new one is replacing it, followed by the start confirmation
  `Notice` for the new session

### Requirement: Stop watch mode command
The "Stop watch mode" command SHALL, when invoked while watch mode is
running, stop clipboard polling, clear the pinned target, and show a
`Notice` stating that watch mode was stopped manually. When invoked while
watch mode is already stopped, the command SHALL be a no-op: no polling
change, no status change, and no `Notice`.

#### Scenario: Manual stop while running
- **WHEN** the user runs "Stop watch mode" while watch mode is active
- **THEN** polling stops immediately, the status bar reflects the off
  state, and a `Notice` is shown stating watch mode was stopped manually

#### Scenario: Stop when not running
- **WHEN** the user runs "Stop watch mode" while watch mode is already
  stopped
- **THEN** the command is a no-op (no error is thrown, no `Notice` is
  shown)

#### Scenario: Manual stop notice is translated
- **WHEN** the active locale is `ar` and the user runs "Stop watch mode"
  while watch mode is active
- **THEN** the stop `Notice` text is shown in Arabic, not English

### Requirement: Automatic stop on note closed or deleted/moved
The system SHALL stop watch mode immediately and show a `Notice` stating
the specific reason (the target note was closed, deleted, or
renamed/moved), in the active locale, when the pinned target note is no
longer open in any pane, or when it is deleted or renamed/moved in the
vault.

#### Scenario: Target note closed in its only pane
- **WHEN** watch mode is running and the user closes the only pane
  displaying the target note
- **THEN** watch mode stops immediately and a `Notice` is shown stating
  the note was closed

#### Scenario: Target note deleted
- **WHEN** watch mode is running and the target note file is deleted from
  the vault
- **THEN** watch mode stops immediately and a `Notice` is shown stating
  the note was deleted

#### Scenario: Target note renamed or moved
- **WHEN** watch mode is running and the target note is renamed or moved
  to a different folder
- **THEN** watch mode stops immediately and a `Notice` is shown stating
  the note was renamed or moved

#### Scenario: Automatic stop notice is translated
- **WHEN** the active locale is `fr` and the target note is deleted while
  watch mode is running
- **THEN** the stop `Notice` text is shown in French, not English
