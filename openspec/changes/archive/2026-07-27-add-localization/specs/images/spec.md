## MODIFIED Requirements

### Requirement: Clipboard is cleared after image insertion when enabled
The plugin SHALL clear the system clipboard immediately after a clipboard image is successfully saved as a vault attachment and its link is inserted at the target note's cursor, when the global "Clear clipboard after image insert" setting is enabled. The clipboard SHALL NOT be cleared before the save and insert both succeed. This setting SHALL be off by default and SHALL apply only to image insertions, not text insertions. The setting's name and description in the settings tab SHALL be shown in the active locale.

#### Scenario: Enabled setting clears clipboard after a successful image insert
- **WHEN** the clear-after-insert setting is enabled and a clipboard image
  is successfully saved and its link inserted at the target note's cursor
- **THEN** the system clipboard is cleared immediately afterward

#### Scenario: Disabled setting leaves the clipboard untouched
- **WHEN** the clear-after-insert setting is disabled (the default) and a
  clipboard image is successfully saved and inserted
- **THEN** the system clipboard is not cleared

#### Scenario: A failed image save does not clear the clipboard
- **WHEN** the clear-after-insert setting is enabled and saving the image
  as a vault attachment fails before an insertion is made
- **THEN** the system clipboard is not cleared

#### Scenario: Clearing does not apply to text insertions
- **WHEN** the clear-after-insert setting is enabled and a text (not
  image) content event is inserted at the target note's cursor
- **THEN** the system clipboard is not cleared as a result of that text
  insertion

#### Scenario: Setting name and description are translated
- **WHEN** the active locale is `es` and the user opens the settings tab
- **THEN** the "Clear clipboard after image insert" setting's name and
  description render in Spanish
