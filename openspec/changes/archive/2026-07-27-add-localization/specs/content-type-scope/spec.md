## MODIFIED Requirements

### Requirement: Choose-settings command selects a scope
The "Start watch mode (choose settings)" command SHALL prompt the user to
choose a content-type scope (Text only / Images only / Both), apply the
chosen scope to the current active note, and persist the choice as the
new last-used scope for future "Start watch mode" invocations. The three
option labels SHALL be shown in the active locale; the persisted scope
value (`"text"` / `"image"` / `"both"`) is unaffected by locale.

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

#### Scenario: Scope option labels are translated
- **WHEN** the active locale is `es` and the user opens "Start watch mode
  (choose settings)"
- **THEN** the content-type dropdown shows the Spanish translations of
  "Text only", "Images only", and "Both"

### Requirement: Status bar shows the active content-type scope
While watch mode is running, the status bar item SHALL display the active
content-type scope alongside the on/off state and target note name. The
scope label SHALL be shown in the active locale.

#### Scenario: Status bar reflects the active scope
- **WHEN** watch mode is running on note "Meeting Notes" with scope
  `"text"`
- **THEN** the status bar item's text includes both "Meeting Notes" and
  an indication that the scope is text-only

#### Scenario: Status bar scope label is translated
- **WHEN** the active locale is `ar` and watch mode is running with scope
  `"both"`
- **THEN** the status bar's scope indication renders using the Arabic
  translation of "Both"
