## ADDED Requirements

### Requirement: Clipboard is cleared after image insertion when enabled
When the global "Clear clipboard after image insert" setting is enabled,
the plugin SHALL clear the system clipboard immediately after a clipboard
image is successfully saved as a vault attachment and its link is inserted
at the target note's cursor. The clipboard SHALL NOT be cleared before the
save and insert both succeed. This setting SHALL be off by default and
SHALL apply only to image insertions, not text insertions.

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

### Requirement: A recopied identical image after a clipboard clear is treated as new
After the system clipboard has been cleared following an image insertion,
the clipboard watcher's image dedupe state SHALL NOT prevent a
subsequently re-copied image with identical content from being detected
and inserted again.

#### Scenario: User intentionally re-copies the same image after it was cleared
- **WHEN** the clear-after-insert setting is enabled, an image has been
  inserted and the clipboard cleared as a result, and the user then copies
  the same image content again
- **THEN** the watcher emits a new image content event and the image is
  inserted again
