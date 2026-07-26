# Clipboard Monitor

Watch the system clipboard and automatically insert new content — text
and/or images — into a pinned target note at that note's editor cursor,
regardless of whether Obsidian or that note's pane currently has focus.
Desktop only.

See [proposal.md](proposal.md) for the full design.

## Status

This repository currently contains only the project scaffold (build, lint,
test, and release tooling). No plugin functionality has been implemented
yet — see `openspec/changes/` for in-progress work.

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

   Updates `package.json` and `manifest.json`, then commits both as
   `"chore: bump version to X.Y.Z"`.

2. **Make your code changes** and commit them:

   ```bash
   git add -A && git commit -m "feat: ..."
   ```

3. **Publish** — pushes the branch, creates a bare version tag (e.g.
   `0.2.0`), and pushes the tag:

   ```bash
   npm run release
   ```

   The tag push triggers the GitHub Actions workflow, which builds, tests,
   and publishes the release.

## License

MIT
