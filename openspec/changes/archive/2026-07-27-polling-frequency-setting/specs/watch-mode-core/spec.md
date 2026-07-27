## MODIFIED Requirements

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
