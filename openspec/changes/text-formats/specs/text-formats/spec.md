## ADDED Requirements

### Requirement: Text formats define reusable insertion templates
A text format SHALL consist of a stable `id`, a `name`, and a `template`
string containing a `{{content}}` token. The plugin SHALL ship four
default formats — Raw (`{{content}}`), Bullet (`- {{content}}`),
Timestamped (`**{{time}}** — {{content}}`), and Callout (`> [!note]\n>
{{content}}`) — on first install.

#### Scenario: Default formats are available on first install
- **WHEN** the plugin loads for the first time, with no prior persisted
  data
- **THEN** the managed format list contains exactly the four default
  formats (Raw, Bullet, Timestamped, Callout)

### Requirement: Rendering a format substitutes its tokens
Rendering a format's template with a piece of copied content SHALL
replace every `{{content}}` token with that content, and every
`{{time}}` token with the current time formatted as 24-hour `HH:MM`.

#### Scenario: Content token is substituted
- **WHEN** the Bullet format's template (`- {{content}}`) is rendered
  with content `"pasted text"`
- **THEN** the rendered result is `"- pasted text"`

#### Scenario: Time token is substituted
- **WHEN** the Timestamped format's template (`**{{time}}** —
  {{content}}`) is rendered with content `"note"` at a time of 14:05
- **THEN** the rendered result is `"**14:05** — note"`

### Requirement: Inserted text uses the active format
When watch mode inserts newly detected clipboard text (per the
content-type scope gate), it SHALL insert the active format's template
rendered with that text, followed by exactly one trailing newline,
rather than the raw copied text.

#### Scenario: Active format is applied to inserted text
- **WHEN** watch mode is running with the Bullet format active and new
  clipboard text `"pasted text"` is detected
- **THEN** `"- pasted text\n"` is inserted at the target note's cursor

#### Scenario: Consecutive entries still land on separate lines
- **WHEN** watch mode is running with any active format and two pieces
  of clipboard text are detected in sequence
- **THEN** the second entry's rendered output starts on its own line,
  after exactly one trailing newline from the first entry's insertion

### Requirement: Start watch mode reuses the last-used format
The fast-path "Start watch mode" command SHALL start watch mode using
the most recently used text format, defaulting to the Raw format if no
format has been used yet.

#### Scenario: First-ever start defaults to Raw
- **WHEN** the user runs "Start watch mode" for the first time, with no
  prior format selection persisted
- **THEN** watch mode starts with the Raw format active

#### Scenario: Subsequent start reuses the previous format
- **WHEN** the user previously started watch mode with the Bullet format
  (via "Start watch mode (choose settings)") and now runs "Start watch
  mode"
- **THEN** watch mode starts with the Bullet format active, without
  prompting

### Requirement: Choose-settings command also selects a text format
The "Start watch mode (choose settings)" command SHALL, in addition to
prompting for a content-type scope, prompt the user to choose a text
format from the managed list, apply the chosen format to the current
activation, and persist the choice as the new last-used format.

#### Scenario: Choosing a format starts watch mode with it
- **WHEN** the user runs "Start watch mode (choose settings)" and
  selects the Callout format
- **THEN** watch mode starts on the active note with the Callout format
  active

#### Scenario: Chosen format becomes the new last-used format
- **WHEN** the user selects the Timestamped format via "Start watch mode
  (choose settings)"
- **THEN** a subsequent "Start watch mode" invocation starts with the
  Timestamped format active

#### Scenario: Dismissing the format picker does not start watch mode
- **WHEN** the user runs "Start watch mode (choose settings)", picks a
  content-type scope, and then dismisses the format picker without
  choosing a format
- **THEN** watch mode does not start and the last-used format is
  unchanged

### Requirement: Settings tab manages the text format list
The plugin's settings tab SHALL let the user add, edit, delete, and
reorder text formats in the managed list, and reset the list to the
four shipped defaults. The list SHALL always contain at least one
format.

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

### Requirement: Format list persists across restarts
The managed format list and the last-used format SHALL persist across
Obsidian restarts. An install that only has a persisted content-type
scope (no format data yet) SHALL be seeded with the default format list
on load, without losing its existing scope data.

#### Scenario: Upgrading from a scope-only install
- **WHEN** the plugin loads with persisted data containing only
  `lastUsedScope` (no `formats` or `lastUsedFormatId`)
- **THEN** the managed list is seeded with the four default formats, the
  last-used format is Raw, and the existing `lastUsedScope` value is
  preserved

#### Scenario: Last-used format is deleted
- **WHEN** the persisted last-used format id no longer matches any
  format in the managed list
- **THEN** the plugin falls back to the first format in the managed list
