# watch-settings-modal Specification

## Purpose
TBD - created by archiving change watch-settings-modal. Update Purpose after archive.
## Requirements
### Requirement: Choose-settings prompt is a single combined modal
"Start watch mode (choose settings)" SHALL present every per-activation
setting together in one modal — the target note, content-type scope, and
text format — rather than as separate, sequentially-opened modals. This
modal SHALL be the home for any future per-activation setting; such
settings SHALL be added as additional fields here rather than as another
chained modal.

#### Scenario: All fields appear in one prompt
- **WHEN** the user runs "Start watch mode (choose settings)"
- **THEN** a single modal opens showing the target note, a content-type
  scope choice, and a text format choice, with no second modal opening
  afterward

### Requirement: Target note is shown for information
The modal SHALL display the full vault-relative path of the note that
will be watched (the active note), not just its basename. This field is
informational only — it is not editable, and watch mode always targets
the active note, same as before this change. If the path is too long to
fit the modal's width, it SHALL be visually truncated with an ellipsis
rather than wrapping or overflowing the modal.

#### Scenario: Target path is visible
- **WHEN** the user runs "Start watch mode (choose settings)" while
  "Projects/Q3/Meeting Notes.md" is the active note
- **THEN** the modal displays "Projects/Q3/Meeting Notes.md" as the
  target, with no way to change it

#### Scenario: Long target path is truncated
- **WHEN** the active note's vault-relative path is too long to fit
  within the modal's target row
- **THEN** the displayed path is truncated with an ellipsis rather than
  wrapping onto multiple lines or overflowing the modal

### Requirement: Fields default to last-used values
The modal's content-type scope and text format fields SHALL be pre-filled
with the current last-used values when opened.

#### Scenario: Prompt opens with prior choices pre-selected
- **WHEN** the user previously ran watch mode with scope "Text only" and
  the Bullet format, and now runs "Start watch mode (choose settings)"
- **THEN** the modal opens with "Text only" and "Bullet" already selected

### Requirement: Confirming with Watch starts watch mode
Clicking the modal's **Watch** button SHALL start watch mode on the
active note using the currently selected scope and format, and SHALL
persist those selections as the new last-used values.

#### Scenario: Watch starts the session with the selected values
- **WHEN** the user changes the format to "Callout" and clicks **Watch**
- **THEN** watch mode starts on the active note with scope and format
  matching what was selected, and a subsequent "Start watch mode" reuses
  the Callout format

### Requirement: Cancelling makes no changes
Clicking **Cancel**, pressing Escape, or clicking outside the modal SHALL
close it without starting watch mode and without changing the persisted
last-used scope or format.

#### Scenario: Cancel button dismisses without starting watch mode
- **WHEN** the user opens the modal and clicks **Cancel**
- **THEN** watch mode does not start and the last-used scope/format are
  unchanged

#### Scenario: Dismissing without an explicit choice behaves like Cancel
- **WHEN** the user opens the modal and closes it via Escape or an
  outside click, without clicking Watch
- **THEN** watch mode does not start and the last-used scope/format are
  unchanged

