# Clipboard Monitor

Turn your clipboard into a live feed into any note — copy something, anywhere, and it lands at your cursor automatically. Built for capturing a stream of screenshots and snippets (e.g. live-noting a meeting) without ever switching back to Obsidian.

## Features

- **True background capture** — inserts into the target note even while Obsidian isn't the focused app. Alt-tab into a call, keep copying screenshots, and they still land in your notes.
- **Pin a note and go** — the active note becomes the target the moment watch mode starts; no picker, no per-copy confirmation
- **Text and images** — copied text and copied images (e.g. screenshots, pasted from any app) are both supported, saved and linked exactly like a normal manual paste
- **Content-type scope** — per session, watch for text only, images only, or both
- **Managed text formats** — a reusable list of insertion templates (Raw, Bullet, Timestamped, Callout, or your own), selected per session and remembered as "last used"
- **Automatic stop** — closing, deleting, or moving the target note stops watch mode immediately, with a notice — no silent orphaned session
- **Status bar indicator** — always shows on/off state, target note, content-type scope, and active format at a glance
- **Configurable polling frequency** — Fast, Moderate, or Slow, to trade responsiveness for CPU usage
- **Clear clipboard after image insert** *(opt-in)* — clears the system clipboard right after an image is saved and inserted
- **Debug logging** *(opt-in)* — verbose watch-mode activity in the developer console, for troubleshooting
- **Localised UI** — English, French, Spanish, and Arabic (with right-to-left layout), automatically matching Obsidian's language setting

> **Desktop only.** Clipboard polling relies on Electron's clipboard APIs, which aren't available on mobile — the plugin declares `isDesktopOnly` and won't install there.

## Usage

### Start watching

Run **Start watch mode** from the command palette (`Cmd/Ctrl P`) with the note you want to capture into open and active. That's it — watch mode reuses your last-used content-type scope and text format, so this is the fast path for repeat use.

The status bar shows something like:

```
Clipboard Monitor: Meeting Notes — Text & Images — Callout
```

Copy anything matching the active scope — text or an image — and it's inserted at your cursor in the target note, formatted with the active template.

### Start with different settings

Run **Start watch mode (choose settings)** to pick the content-type scope and text format for this session before starting. Your choices become the new "last used" defaults for next time.

### Stop watching

Run **Stop watch mode**, or just close, delete, or move the target note — any of those stops watch mode automatically, with a notice.

### Text formats

Templates use `{{content}}` for the copied text (or an image's generated embed link) and `{{time}}` for the current time (`HH:MM`). Ships with:

| Format | Template |
|---|---|
| Raw | `{{content}}` |
| Bullet | `- {{content}}` |
| Timestamped | `**{{time}}** — {{content}}` |
| Callout | `> [!note]\n> {{content}}` |

Add, edit, delete, or reorder formats in **Settings → Clipboard Monitor**; a format applies to both text and images, so under Bullet, a captured image becomes `- ![[Pasted image ....png]]`. **Reset to defaults** restores the shipped four if you want to start over.

## Settings

Open **Settings → Clipboard Monitor** to configure:

| Setting | Default | Description |
|---|---|---|
| Polling frequency | Moderate | Fast, Moderate, or Slow — how often the clipboard is checked. Faster notices new content sooner but uses more CPU. |
| Clear clipboard after image insert | Off | Clears the *entire* system clipboard (all formats) right after an image is saved and inserted. Re-copying the same image afterward is treated as new content and reinserted. |
| Text formats | 4 built-in | Managed list of insertion templates — add/edit/delete/reorder, or reset to defaults. |
| Debug logging | Off | Logs polling, dedupe, and insertion activity to the developer console, prefixed `[Clipboard Monitor]`. Takes effect immediately, even mid-session. |

Target note, content-type scope, and text format are deliberately **not** global settings — they're chosen per watch-mode session and remembered as "last used."

## Localisation

The plugin UI is available in **English** (default), **French**, **Spanish**, and **Arabic** (right-to-left). Language is detected automatically from Obsidian's language setting.

To add a new language:

1. Copy `src/ts/i18n/locales/en.json` to `src/ts/i18n/locales/<code>.json` (e.g. `de.json`)
2. Translate all values — keys must stay identical to `en.json`
3. Register it in `src/ts/i18n/i18n.ts`:
   ```ts
   import de from "./locales/de.json";
   export const locales: Record<string, Partial<Translations>> = { en, fr, es, ar, de };
   ```
4. If the language reads right-to-left, add its code to `RTL_LOCALES` in the same file
5. Rebuild with `npm run build`

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Copy them into your vault at `.obsidian/plugins/clipboard-monitor/`
3. Enable the plugin in **Settings → Community plugins**

## Development

### Prerequisites

- Node.js ≥ 18
- An Obsidian vault for testing

### Setup

```bash
# Install dependencies
npm install

# Copy .env.example and set your vault plugin path
cp .env.example .env
```

### Scripts

```bash
# Production build → dist/main.js
npm run build

# Development build (inline sourcemaps)
npm run dev

# Copy dist/ to your local vault plugin directory
npm run deploy

# Build + deploy in one step
npm run dev:deploy

# Rebuild + deploy whenever src/ changes
npm run dev:deploy:watch

# Remove dist/
npm run clean

# Lint / format / test
npm run lint
npm run format
npm test
```

### Releases

1. **Bump the version** — choose `patch`, `minor`, or `major`:

   ```bash
   npm run release:prepare patch
   ```

   Updates `package.json` and `manifest.json`, then commits both as `"chore: bump version to X.Y.Z"`.

2. **Make your code changes** and commit them:

   ```bash
   git add -A && git commit -m "feat: ..."
   ```

3. **Publish** — pushes the branch, creates a bare version tag (e.g. `0.2.0`), and pushes the tag:

   ```bash
   npm run release
   ```

   The tag push triggers the GitHub Actions workflow, which builds, tests, and publishes the release.

## License

MIT
