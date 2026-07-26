## 1. Default template newlines

- [x] 1.1 In `src/ts/watchMode/textFormat.ts`, add a leading `\n` to Raw
      (`"\n{{content}}"`), Bullet (`"\n- {{content}}"`), Timestamped
      (`"\n**{{time}}** — {{content}}"`), and Callout (`"\n>
      [!note]\n> {{content}}"`) entries in `DEFAULT_TEXT_FORMAT_DEFS`.
- [x] 1.2 Update `src/ts/watchMode/textFormat.spec.ts`'s
      `createDefaultTextFormats` assertions and any test asserting exact
      default template strings to match the new leading-`\n` templates,
      including Raw. Add a case rendering the Callout template twice in a
      row (each followed by the controller's usual trailing `\n`, as
      `watchModeController.spec.ts` already simulates) and asserting a
      blank line separates the two rendered blocks.

## 2. Image embed link

- [x] 2.1 In `src/ts/watchMode/obsidianHost.ts#saveImageAttachment`,
      prepend `!` to the string returned by
      `app.fileManager.generateMarkdownLink(file, sourcePath)`.

## 3. Image insertion respects the active text format

- [x] 3.1 In `src/ts/watchMode/watchModeController.ts`'s image branch of
      `handleNewContent`, replace the direct `insertText(editor,
      `${link}\n`)` with `insertText(editor,
      `${renderFormat(this.format.template, link)}\n`)`, mirroring the
      text branch exactly.
- [x] 3.2 Update `src/ts/watchMode/watchModeController.spec.ts`: add a
      case inserting an image under the Bullet format fixture and
      asserting the result is `"- ![[...]]\n"` (format applied), and a
      case under the Timestamped format fixture asserting the time prefix
      appears before the embed link. Existing image tests (which use the
      Raw format fixture) continue to assert the bare embed link, since
      that fixture's template has no decoration.
- [x] 3.3 Update the top-level `proposal.md` (§4.3, §4.7, §6) to reflect
      that format selection now applies to both text and images, not text
      only.

## 4. Verification

- [x] 4.1 Run `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm
      test` and confirm all pass.
- [ ] 4.2 Run `npm run dev:deploy` and manually verify in the test vault:
      reset formats to defaults (or reinstall fresh) and confirm Raw,
      Bullet, Timestamped, and Callout entries each start on their own
      line even when the cursor was mid-line beforehand; capture two
      clipboard texts in a row under the Callout format and confirm they
      render as two separate callouts, not one merged blockquote; copy an
      image under the Bullet format and confirm it inserts as `-
      ![[...]]` (embed prefix, format applied); copy an image under Raw
      and confirm it's a bare embed link.
