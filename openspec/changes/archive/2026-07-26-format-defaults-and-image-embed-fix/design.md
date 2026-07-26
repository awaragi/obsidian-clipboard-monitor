## Context

Both bugs were found during manual testing of the currently-deployed
plugin (`../brains-work` test vault) — the first real end-to-end runs
this project has had, since `content-type-scope`'s manual-verification
task was skipped and `text-formats`'/`images`' were done without a
combined-format/image session like this one.

## Goals / Non-Goals

**Goals:**
- All four default templates render correctly regardless of where the
  cursor sits when the first capture of a session lands, and consecutive
  same-format captures render as separate, correctly-formed blocks
  (specifically: separate callouts, not one merged blockquote).
- Clipboard-saved images insert as embeds (`![[...]]`), matching what a
  normal manual paste produces in Obsidian.
- Image insertion applies the active text format, the same as text
  insertion does — one active format governs both content types for a
  session, not just text.

**Non-Goals:**
- No change to `renderFormat`'s signature or the `{{content}}`/`{{time}}`
  substitution logic — this only changes the shipped template *strings*.
- No cursor-position-aware conditional newline logic (e.g., "only add a
  leading newline if the cursor isn't already at the start of a line") —
  a single unconditional leading `\n` is simpler, and its only downside
  (one blank line at the very top of an empty note, or one extra blank
  line separating an entry from unrelated preceding content, or between
  consecutive same-format entries — see Risks) is minor and consistent
  with how the existing trailing-`\n` convention already works.
- No change to how *custom* (non-default) user-authored formats behave —
  this only changes the four shipped defaults' template strings, which
  only affects first-install seeding and "Reset to defaults."

## Decisions

- **Leading `\n` added to all four defaults, Raw included.** Initially
  Raw was left unchanged on the theory that "minimal passthrough" implied
  "no added newline," but that conflated two different things: the
  template's *decoration* (Raw correctly has none) and *not gluing onto
  whatever precedes the cursor* (a problem every format has equally,
  including Raw). A leading `\n` guarantees the entry starts on its own
  line even when the cursor wasn't already there — the one scenario the
  "controller always appends a trailing `\n`" convention doesn't already
  cover (the first capture of a session). For Callout specifically, the
  same leading `\n` additionally solves the merged-blockquote bug: between
  two consecutive callout captures, entry N's own controller-appended
  trailing `\n` combines with entry N+1's template's leading `\n` to form
  a real blank line (`\n` + `\n`), which is what tells CommonMark to
  start a new blockquote block instead of continuing the previous one.
  No template needs a *trailing* `\n` of its own — the controller already
  appends exactly one after every render, and doubling up would produce
  inconsistent spacing depending on which format is active.
- **`saveImageAttachment` prepends `!` unconditionally**, not
  conditionally on file extension. This method only ever saves clipboard
  images (always PNG, per `attachmentFilename.ts`), so there's no
  non-image case to guard against. If a future change adds saving other
  attachment types through this same method, that's the point to add a
  real embeddable-type check — premature to add it now for a method with
  exactly one caller and one file type.
- **`WatchModeController`'s image branch renders the embed link through
  `renderFormat(this.format.template, link)`**, exactly like the text
  branch already does, instead of inserting `link` directly. This means
  `{{time}}` also gets substituted for image captures under the
  Timestamped format (e.g. `**14:05** — ![[...]]`), which is consistent
  — there's no reason time-stamping should apply to text captures but not
  image ones. No new parameter or branch is needed in `renderFormat`
  itself: it already just substitutes tokens into whatever string it's
  given, so passing an embed link instead of copied text works
  unchanged.

## Risks / Trade-offs

- [A leading `\n` on every default means the very first capture into a
  genuinely empty note leaves one blank line at the top] → accepted as a
  minor, harmless cosmetic cost; avoiding it would need cursor-position
  awareness in `renderFormat`, out of scope per Non-Goals.
- [A leading `\n` also means *every* consecutive same-format capture now
  gets a blank line between it and the previous one, not just Callout —
  entry N's controller-appended trailing `\n` plus entry N+1's leading
  `\n` always combine into a blank line, regardless of format. Rapid-fire
  captures under Raw or Bullet are now "loose" (double-spaced) rather
  than tight, which wasn't the original intent for those two] → accepted
  for this change: fixing "glues onto the cursor's prior position" and
  "callouts merge" both require the same mechanism (a leading `\n`), and
  there's no template-level way to get "fresh line, but no blank line
  between repeats" without cursor-position awareness (out of scope, see
  Non-Goals). If tight consecutive-capture spacing turns out to matter in
  practice, that's a follow-up change, not a reason to withhold this fix.
- [A user who already customized the default templates before this
  change keeps their old (leading-newline-free) version — only
  first-install seeding and "Reset to defaults" pick up the fix] →
  expected and consistent with how format-list persistence already works
  (`text-formats/design.md`); no migration of existing custom formats.

## Migration Plan

Purely a change to constant strings and one link-generation call — no
persisted-data shape changes, no migration. Existing installs only see
the new defaults if they hit "Reset to defaults" or reinstall fresh.

## Open Questions

None — both fixes were reproduced and confirmed against the real test
vault by the user during manual testing.
