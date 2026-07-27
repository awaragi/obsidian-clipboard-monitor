## MODIFIED Requirements

### Requirement: Choose-settings prompt is a single combined modal
"Start watch mode (choose settings)" SHALL present every per-activation
setting together in one modal — the target note, content-type scope, and
text format — rather than as separate, sequentially-opened modals. This
modal SHALL be the home for any future per-activation setting; such
settings SHALL be added as additional fields here rather than as another
chained modal. The modal's title and field labels SHALL be shown in the
active locale, and the modal's root element SHALL set a `dir` attribute
reflecting whether the active locale is right-to-left or left-to-right.

#### Scenario: All fields appear in one prompt
- **WHEN** the user runs "Start watch mode (choose settings)"
- **THEN** a single modal opens showing the target note, a content-type
  scope choice, and a text format choice, with no second modal opening
  afterward

#### Scenario: Modal title and labels are translated
- **WHEN** the active locale is `es` and the user runs "Start watch mode
  (choose settings)"
- **THEN** the modal's title and its "Target", "Content type", and "Text
  format" labels appear in Spanish

#### Scenario: Modal sets RTL direction under an RTL locale
- **WHEN** the active locale is `ar` and the user runs "Start watch mode
  (choose settings)"
- **THEN** the modal's root element has `dir="rtl"`

### Requirement: Cancelling makes no changes
Clicking **Cancel**, pressing Escape, or clicking outside the modal SHALL
close it without starting watch mode and without changing the persisted
last-used scope or format. The **Watch** and **Cancel** button labels
SHALL be shown in the active locale.

#### Scenario: Cancel button dismisses without starting watch mode
- **WHEN** the user opens the modal and clicks **Cancel**
- **THEN** watch mode does not start and the last-used scope/format are
  unchanged

#### Scenario: Dismissing without an explicit choice behaves like Cancel
- **WHEN** the user opens the modal and closes it via Escape or an
  outside click, without clicking Watch
- **THEN** watch mode does not start and the last-used scope/format are
  unchanged

#### Scenario: Watch and Cancel buttons are translated
- **WHEN** the active locale is `fr` and the modal is open
- **THEN** the **Watch** and **Cancel** buttons display their French
  translations
