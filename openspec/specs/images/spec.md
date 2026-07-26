# images Specification

## Purpose
TBD - created by archiving change images. Update Purpose after archive.
## Requirements
### Requirement: Clipboard images are detected and deduplicated
While watch mode is running, the clipboard watcher SHALL detect when the
clipboard holds image content distinct from the last-seen image, using a
content hash independent of the text dedupe hash. Identical image content
SHALL NOT trigger insertion more than once in a row.

#### Scenario: A new image on the clipboard is detected
- **WHEN** watch mode is running and the user copies an image that was not
  the previous clipboard content
- **THEN** the watcher emits a new image content event

#### Scenario: Identical image content is not re-inserted
- **WHEN** watch mode is running and the same image remains on the
  clipboard across multiple poll ticks
- **THEN** only the first tick emits an image content event; subsequent
  ticks with the unchanged image do not

#### Scenario: Switching from that image back to previously-seen text is still detected
- **WHEN** an image was just inserted and the clipboard then changes to
  text that was on the clipboard before the image (but not since)
- **THEN** the watcher emits a new text content event, independent of the
  image dedupe state

### Requirement: An image present alongside text takes priority
The watcher SHALL emit only the image content event when a single poll
tick finds both new image content and text content on the clipboard;
the coincident text SHALL NOT also be emitted.

#### Scenario: Copying an image that also sets clipboard text
- **WHEN** watch mode is running and a single copy action leaves both a
  new image and new text on the clipboard, detected in the same poll tick
- **THEN** only the image content event is emitted for that tick

### Requirement: Content-type scope gates image insertion
Newly detected clipboard image content SHALL only be inserted when the
active content-type scope is `"image"` or `"both"`; scope `"text"` SHALL
block image insertion entirely (not queued, not logged).

#### Scenario: Scope "both" allows image insertion
- **WHEN** watch mode is running with scope `"both"` and new image content
  is detected
- **THEN** the image is saved and its link is inserted at the target
  note's cursor

#### Scenario: Scope "image" allows image insertion
- **WHEN** watch mode is running with scope `"image"` and new image
  content is detected
- **THEN** the image is saved and its link is inserted at the target
  note's cursor

#### Scenario: Scope "text" blocks image insertion
- **WHEN** watch mode is running with scope `"text"` and new image content
  is detected
- **THEN** the image is not saved and nothing is inserted

### Requirement: Detected images are saved as vault attachments and linked
When an image passes the content-type scope gate, the plugin SHALL save
it as a binary file in the vault via `vault.createBinary()`, resolve its
path via `fileManager.getAvailablePathForAttachment()`, generate its link
via `fileManager.generateMarkdownLink()`, and insert the resulting link
string at the target note's stored cursor position, using the vault's
existing Files & Links settings (no plugin-side image settings).

#### Scenario: A new image is saved and linked
- **WHEN** watch mode is running with a scope that allows images and new
  image content is detected
- **THEN** the image is written to the vault's configured attachment
  location and a link to it is inserted at the target note's cursor,
  followed by a trailing newline

#### Scenario: Attachment filenames match Obsidian's own manual-paste convention
- **WHEN** a clipboard image is saved as an attachment
- **THEN** its filename follows the pattern `Pasted image
  <timestamp>.png`, the same convention Obsidian's own paste handler uses

### Requirement: A stale target after an in-flight save does not insert
The generated link SHALL NOT be inserted once an image attachment save
completes if the watch-mode target changed (the session stopped, or a
new session started) while that save was still in progress.

#### Scenario: Note closes while an image is being saved
- **WHEN** an image attachment save is in progress and the target note is
  closed before the save completes
- **THEN** once the save completes, its link is not inserted into any
  note

