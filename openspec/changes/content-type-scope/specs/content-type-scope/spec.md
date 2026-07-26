## ADDED Requirements

### Requirement: Content-type scope gates text insertion
Each watch mode session SHALL have an active content-type scope of
`"text"`, `"image"`, or `"both"`. When the active scope is `"image"`,
newly detected clipboard text SHALL NOT be inserted, queued, or logged.
When the active scope is `"text"` or `"both"`, newly detected clipboard
text SHALL be inserted as in `watch-mode-core`.

#### Scenario: Text-only scope allows text insertion
- **WHEN** watch mode is running with scope `"text"` and new clipboard
  text is detected
- **THEN** the text is inserted at the target note's cursor

#### Scenario: Both scope allows text insertion
- **WHEN** watch mode is running with scope `"both"` and new clipboard
  text is detected
- **THEN** the text is inserted at the target note's cursor

#### Scenario: Images-only scope blocks text insertion
- **WHEN** watch mode is running with scope `"image"` and new clipboard
  text is detected
- **THEN** the text is not inserted, and no error occurs

### Requirement: Start watch mode reuses the last-used scope
The fast-path "Start watch mode" command SHALL start watch mode using the
most recently used content-type scope, defaulting to `"both"` if no scope
has been used yet (e.g. on first install).

#### Scenario: First-ever start defaults to both
- **WHEN** the user runs "Start watch mode" for the first time, with no
  prior scope selection persisted
- **THEN** watch mode starts with scope `"both"`

#### Scenario: Subsequent start reuses the previous scope
- **WHEN** the user previously started watch mode with scope `"text"`
  (via either command) and now runs "Start watch mode"
- **THEN** watch mode starts with scope `"text"`, without prompting

### Requirement: Choose-settings command selects a scope
The "Start watch mode (choose settings)" command SHALL prompt the user to
choose a content-type scope (Text only / Images only / Both), apply the
chosen scope to the current active note, and persist the choice as the
new last-used scope for future "Start watch mode" invocations.

#### Scenario: Choosing a scope starts watch mode with it
- **WHEN** the user runs "Start watch mode (choose settings)" and selects
  "Images only"
- **THEN** watch mode starts on the active note with scope `"image"`

#### Scenario: Chosen scope becomes the new last-used scope
- **WHEN** the user selects "Text only" via "Start watch mode (choose
  settings)"
- **THEN** a subsequent "Start watch mode" invocation starts with scope
  `"text"`

#### Scenario: Cancelling the picker does not start watch mode
- **WHEN** the user runs "Start watch mode (choose settings)" and
  dismisses the picker without selecting a scope
- **THEN** watch mode does not start and the last-used scope is unchanged

### Requirement: Status bar shows the active content-type scope
While watch mode is running, the status bar item SHALL display the active
content-type scope alongside the on/off state and target note name.

#### Scenario: Status bar reflects the active scope
- **WHEN** watch mode is running on note "Meeting Notes" with scope
  `"text"`
- **THEN** the status bar item's text includes both "Meeting Notes" and
  an indication that the scope is text-only
