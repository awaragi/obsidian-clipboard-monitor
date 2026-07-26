## Why

Manual testing surfaced two bugs:

1. Three of the four shipped default text formats produce broken markdown
   when inserted mid-document. Worst offender: **Callout** — consecutive
   callout captures render as one merged blockquote instead of separate
   callouts, because CommonMark continues a blockquote across adjacent
   `>`-prefixed lines with no blank line between them; the template has
   no leading newline, so two callout insertions in a row (each ending
   in exactly one controller-appended `\n`) land with only a single `\n`
   between `> content1` and `> [!note]` — not the blank line a new
   blockquote block needs. **Bullet** and **Timestamped** have the milder
   version of the same problem: if watch mode's first capture lands with
   the cursor mid-line (not at the start of a fresh line), the template
   glues onto whatever's already there instead of starting cleanly on its
   own line.
2. Clipboard images are inserted as plain `[[Pasted image ....png]]`
   wikilinks instead of embeds (`![[Pasted image ....png]]`). Checked
   against the actual test vault's config
   (`../brains-work/.obsidian/app.json`): link *style* (wikilink vs.
   markdown, relative path) is unrelated — `generateMarkdownLink` only
   controls that, not whether the link embeds. Embedding is the caller's
   responsibility; `saveImageAttachment` never adds the `!` prefix.

## What Changes

- Add a single leading `\n` to the **Bullet** and **Timestamped** default
  templates, so each starts on its own fresh line regardless of where the
  cursor was when the first capture of a session lands.
- Add a single leading `\n` to the **Callout** template. Combined with
  the controller's existing per-entry trailing `\n`, this produces a true
  blank line between consecutive callout captures (fixing the
  merged-blockquote bug) while only costing a fresh-line move — not an
  extra blank line — against arbitrary non-callout content before it.
- Add a single leading `\n` to **Raw** too (`"\n{{content}}"`) — on
  reflection, the same "don't glue onto whatever the cursor was sitting
  after" problem applies to Raw as much as the other three; there's
  nothing special about it that should exempt it from the fix.
- `obsidianHost.ts#saveImageAttachment` now prepends `!` to the link
  `fileManager.generateMarkdownLink()` returns, since every attachment
  this method saves is an image and Obsidian's own manual image-paste
  output is always an embed.
- **Revises proposal.md §4.3's original scoping** ("Format selection only
  applies to text; irrelevant when scope is images-only") per explicit
  updated direction: image insertion now applies the active text format
  too. `WatchModeController`'s image branch was inserting the raw embed
  link directly, ignoring `this.format` entirely. It now renders the link
  through `renderFormat(this.format.template, link)` first — e.g. under
  the Bullet format, an inserted image becomes `- ![[Pasted image
  ....png]]`, not a bare embed. The top-level `proposal.md` is updated to
  match.

## Capabilities

### New Capabilities
- `insertion-fixes`: correct newline handling in the shipped default
  text formats, and correct embed-link generation for saved images.

### Modified Capabilities
(none — `openspec/specs/` has no archived capabilities yet for this
project; this capability corrects behavior introduced in `text-formats`
and `images`, expressed here as a new capability rather than as deltas
against unarchived bases, consistent with how prior changes in this
project handled the same situation)

## Impact

- Affected code: `src/ts/watchMode/textFormat.ts` (default template
  strings only — no type or function signature changes),
  `src/ts/watchMode/obsidianHost.ts` (`saveImageAttachment`).
- No data-shape changes. Existing custom (non-default) formats a user may
  have already created are untouched — this only changes the *shipped*
  defaults, which only affects first-install seeding and "Reset to
  defaults."
