## Why

The repo currently contains only a technical proposal (`proposal.md`) and no
buildable plugin project. Before any watch-mode logic can be implemented,
the project needs the standard Obsidian community plugin scaffold — manifest,
TypeScript + esbuild build pipeline, lint/format/test tooling, local-vault
deploy script, and a release/publish workflow — so subsequent changes can
add features incrementally against a working build.

## What Changes

- Add `package.json` with dev/build/lint/format/test/release scripts.
- Add `manifest.json` with `isDesktopOnly: true` (per proposal.md §2, mobile
  is explicitly unsupported).
- Add `tsconfig.json`, `esbuild.config.mjs` (bundles `src/ts/main.ts` to
  `dist/main.js`, externalizes `obsidian`/`electron`/CodeMirror/builtins,
  copies `manifest.json` and `styles.css` into `dist/`).
- Add `eslint.config.mjs` and `.prettierrc` for TS linting/formatting.
- Add `vitest.config.ts` for unit tests under `src/ts/**/*.spec.ts`.
- Add `scripts/deploy.mjs` (copy `dist/` output into a local vault's plugin
  folder via `OBSIDIAN_PLUGIN_DIR` from `.env`), `scripts/version.mjs`
  (bump `package.json`/`manifest.json` version in lockstep), and
  `scripts/publish.mjs` (tag + push a release).
- Add `.env.example`, `.gitignore`.
- Add `.github/workflows/release.yml` — on version tag push, build, run
  tests, attest build artifacts, and create a GitHub release with
  `main.js`, `manifest.json`, `styles.css`.
- Add minimal `src/ts/main.ts` (empty `Plugin` subclass with `onload`/
  `onunload`) and `src/css/styles.css` (empty placeholder) so the build
  pipeline has something to compile.
- Add `README.md` and `LICENSE` stubs.
- Initialize the directory as a git repository (currently not one) so the
  version/publish scripts and release workflow have something to operate on.

## Capabilities

### New Capabilities
- `project-scaffold`: the build, lint, test, deploy, and release tooling
  that turns this repo into a buildable, publishable Obsidian plugin
  project — independent of any plugin feature logic.

### Modified Capabilities
(none — this is the first change in the project)

## Impact

- Affected code: entire repo root (new config/build files), new `src/`
  tree, new `scripts/` tree, new `.github/workflows/`.
- Dependencies added: `esbuild`, `typescript`, `obsidian` (types), `eslint`
  + `@typescript-eslint/*` + `@eslint/js`, `prettier`, `vitest`, `watch`,
  `@types/node`.
- No runtime plugin behavior is introduced by this change — `main.ts` is a
  no-op scaffold. Feature work (clipboard watcher, editor insertion, etc.)
  is out of scope and follows in later changes per proposal.md §5.
