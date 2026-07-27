## MODIFIED Requirements

### Requirement: Settings tab manages the text format list
The plugin's settings tab SHALL let the user add, edit, delete, and
reorder text formats in the managed list, and reset the list to the
four shipped defaults. The list SHALL always contain at least one
format. The section heading, description, input placeholders, button
labels ("Add", "Reset to defaults"), per-row move/delete tooltips, and
the reset/delete confirmation dialogs' title, message, and confirm-button
text SHALL be shown in the active locale. User-authored content (a
format's own `name` and `template`) is never translated.

#### Scenario: Adding a format
- **WHEN** the user adds a new format with a name and template in the
  settings tab
- **THEN** the new format appears in the managed list and is available
  in the format picker

#### Scenario: Deleting the only remaining format is not allowed
- **WHEN** the managed list contains exactly one format
- **THEN** the settings tab does not allow deleting it

#### Scenario: Resetting to defaults
- **WHEN** the user chooses "Reset to defaults" in the settings tab
- **THEN** the managed list is replaced with the four shipped default
  formats, discarding any custom formats

#### Scenario: Section chrome is translated
- **WHEN** the active locale is `fr` and the user opens the settings tab
- **THEN** the "Text formats" heading, its description, the "Name" and
  template placeholders, and the "Add"/"Reset to defaults" buttons all
  render in French

#### Scenario: Row action tooltips are translated
- **WHEN** the active locale is `es` and the user hovers a format row's
  move-up, move-down, or delete icon
- **THEN** the tooltip text renders in Spanish

#### Scenario: Reset confirmation dialog is translated
- **WHEN** the active locale is `ar` and the user clicks "Reset to
  defaults"
- **THEN** the confirmation dialog's title, message, and confirm button
  render in Arabic

#### Scenario: Delete confirmation dialog is translated, including the format's own name
- **WHEN** the active locale is `ar` and the user deletes a format named
  "Bullet"
- **THEN** the confirmation dialog's title and confirm button render in
  Arabic, and its message is the Arabic translation with "Bullet"
  interpolated unchanged
