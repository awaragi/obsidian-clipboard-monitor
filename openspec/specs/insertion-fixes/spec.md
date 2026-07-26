# insertion-fixes Specification

## Purpose
TBD - created by archiving change format-defaults-and-image-embed-fix. Update Purpose after archive.
## Requirements
### Requirement: Default templates start on their own line
Every shipped default text format SHALL render with a leading newline
(Raw, Bullet, Timestamped, and Callout), so an inserted entry always
starts on its own line regardless of where the cursor was positioned.

#### Scenario: Raw entry does not glue onto existing text
- **WHEN** the cursor sits at the end of an existing non-empty line (no
  trailing newline) and a new Raw-formatted entry is inserted
- **THEN** the entry starts on a new line below the existing text, not
  appended to the end of it

#### Scenario: Bullet entry does not glue onto existing text
- **WHEN** the cursor sits at the end of an existing non-empty line (no
  trailing newline) and a new Bullet-formatted entry is inserted
- **THEN** the entry starts on a new line below the existing text, not
  appended to the end of it

#### Scenario: Timestamped entry does not glue onto existing text
- **WHEN** the cursor sits at the end of an existing non-empty line and a
  new Timestamped-formatted entry is inserted
- **THEN** the entry starts on a new line below the existing text

### Requirement: Consecutive Callout entries render as separate callouts
Two Callout-formatted entries inserted one after another SHALL render as
two distinct callout blocks, not as one merged blockquote.

#### Scenario: Two callouts in a row stay separate
- **WHEN** watch mode is running with the Callout format and two pieces
  of clipboard text are detected in sequence
- **THEN** the resulting markdown has a blank line between the first
  callout's content and the second callout's `> [!note]` line

### Requirement: Saved images insert as embeds
An image saved as a vault attachment SHALL be inserted as an embed link
(prefixed with `!`), matching what Obsidian's own manual image paste
produces — not a plain reference link.

#### Scenario: Clipboard image inserts with the embed prefix
- **WHEN** watch mode saves a new clipboard image as an attachment and
  inserts its link
- **THEN** the inserted text begins with `!` (e.g. `![[Pasted image
  20260726120000.png]]`), not a bare `[[...]]` link

### Requirement: Image insertion applies the active text format
The active session's text format SHALL be applied to image insertions the
same way it's applied to text: the image's embed link is substituted for
`{{content}}` in the active format's template before insertion.

#### Scenario: Bullet format wraps an inserted image
- **WHEN** watch mode is running with the Bullet format active and a new
  clipboard image is detected
- **THEN** the inserted text is `- ![[<generated filename>]]`, not a bare
  embed link

#### Scenario: Timestamped format applies to an inserted image
- **WHEN** watch mode is running with the Timestamped format active and a
  new clipboard image is detected
- **THEN** the inserted text includes the current time prefix followed by
  the image's embed link, matching how a text capture would be
  timestamped

