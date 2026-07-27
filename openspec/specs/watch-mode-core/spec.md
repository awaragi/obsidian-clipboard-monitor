# watch-mode-core Specification

## Purpose
TBD - created by archiving change watch-mode-core. Update Purpose after archive.
## Requirements
### Requirement: Clipboard polling with hash-based dedupe

While watch mode is active, the system SHALL poll the system clipboard's
text content on an interval determined by the polling-frequency setting's
value at the moment the watch session was started, and SHALL treat content
as new only when its hash differs from the hash of the last-seen content.
Identical consecutive clipboard content SHALL NOT be inserted more than
once. The polling interval SHALL NOT change for a session already in
progress, even if the polling-frequency setting is changed while that
session is running.

#### Scenario: New text is detected once
- **WHEN** watch mode is running and the user copies text that differs
  from the last-seen clipboard content
- **THEN** the system detects it as new exactly once and does not
  re-detect it on subsequent poll ticks while the clipboard is unchanged

#### Scenario: Repeated copy of the same text is ignored
- **WHEN** watch mode is running and the user copies the same text twice
  in a row (clipboard content unchanged between the two copies)
- **THEN** the system inserts it only on the first detection and does not
  insert it again for the second, identical copy

#### Scenario: Clipboard images are ignored
- **WHEN** watch mode is running and the clipboard contains an image
  (no text)
- **THEN** the system does not insert anything and does not error

#### Scenario: Polling interval is fixed for the session's lifetime
- **WHEN** watch mode is started while the polling-frequency setting is
  Moderate, and the setting is then changed to Fast while that session is
  still running
- **THEN** the running session keeps polling at the Moderate interval for
  the rest of its lifetime

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

### Requirement: Stop watch mode command
The "Stop watch mode" command SHALL, when invoked while watch mode is
running, stop clipboard polling and clear the pinned target.

#### Scenario: Manual stop while running
- **WHEN** the user runs "Stop watch mode" while watch mode is active
- **THEN** polling stops immediately and the status bar reflects the
  off state

#### Scenario: Stop when not running
- **WHEN** the user runs "Stop watch mode" while watch mode is already
  stopped
- **THEN** the command is a no-op (no error is thrown)

### Requirement: Command palette entries are translated
The "Start watch mode", "Start watch mode (choose settings)", and "Stop watch mode" command palette entries SHALL display their name in the active locale.

#### Scenario: Command names appear in the active locale
- **WHEN** the active locale is `fr` and the user opens the command
  palette
- **THEN** the three watch-mode commands appear with their French names

### Requirement: Cursor insertion into the pinned note
When new clipboard text is detected, the system SHALL insert it, followed
by a newline, at the pinned target note's editor cursor in whichever open
pane displays that note, regardless of whether that pane currently has
focus, and SHALL advance the cursor past the inserted text and newline so
that a subsequent insertion appends after it rather than overwriting it.
The trailing newline is a placeholder default for this change only —
Build Phase 4's managed text-format templates (proposal.md §4.3) replace
it with a user-selected `{{content}}` template.

#### Scenario: Insertion into an unfocused pane
- **WHEN** the target note is open in a pane that is not the currently
  focused pane, and new clipboard text is detected
- **THEN** the text is inserted at that pane's editor cursor without
  requiring the pane to be focused

#### Scenario: Consecutive entries land on separate lines
- **WHEN** two separate new clipboard entries are detected one after the
  other while watch mode is running
- **THEN** each entry appears on its own line in the note, not run
  together on the same line

#### Scenario: Consecutive insertions do not overwrite each other
- **WHEN** two separate new clipboard entries are detected one after the
  other while watch mode is running
- **THEN** the second entry's text appears immediately after the first
  entry's text in the note, not overlapping or replacing it

### Requirement: Automatic stop on note closed or deleted/moved
The system SHALL stop watch mode immediately and show a `Notice` alert
when the pinned target note is no longer open in any pane, or when it is
deleted or renamed/moved in the vault.

#### Scenario: Target note closed in its only pane
- **WHEN** watch mode is running and the user closes the only pane
  displaying the target note
- **THEN** watch mode stops immediately and a `Notice` is shown

#### Scenario: Target note deleted
- **WHEN** watch mode is running and the target note file is deleted from
  the vault
- **THEN** watch mode stops immediately and a `Notice` is shown

#### Scenario: Target note renamed or moved
- **WHEN** watch mode is running and the target note is renamed or moved
  to a different folder
- **THEN** watch mode stops immediately and a `Notice` is shown

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

