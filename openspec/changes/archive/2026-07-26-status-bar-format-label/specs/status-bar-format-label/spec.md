## ADDED Requirements

### Requirement: Status bar indicator
The system SHALL display a status bar item reflecting whether watch mode
is currently running and, when running, the pinned target note's name,
the active content-type scope, and the active text format's name.

#### Scenario: Status bar reflects running state
- **WHEN** watch mode is started with a note named "Meeting Notes", scope
  "Text only", and format "Callout"
- **THEN** the status bar item displays that watch mode is on and shows
  "Meeting Notes", "Text only", and "Callout"

#### Scenario: Status bar reflects stopped state
- **WHEN** watch mode is stopped (manually or automatically)
- **THEN** the status bar item updates to reflect the off state, with no
  target, scope, or format shown
