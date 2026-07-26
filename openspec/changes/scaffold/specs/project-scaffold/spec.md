## ADDED Requirements

### Requirement: Desktop-only plugin manifest
The project SHALL ship a `manifest.json` identifying it as the "Clipboard
Monitor" plugin (`id: "clipboard-monitor"`) and declaring `isDesktopOnly:
true`, so Obsidian refuses to install it on mobile per the proposal's
feasibility decision.

#### Scenario: Manifest declares desktop-only
- **WHEN** `manifest.json` is read by Obsidian or by the build's copy step
- **THEN** it contains `"isDesktopOnly": true`, a matching `id`/`name`, and
  a `version` equal to `package.json`'s `version`

### Requirement: Build pipeline produces a loadable plugin bundle
The project SHALL provide `npm run build` (production) and `npm run dev`
(watch/dev) commands that bundle the TypeScript entry point into a single
CommonJS `dist/main.js`, externalizing `obsidian`, `electron`, CodeMirror
packages, and Node builtins, and copy `manifest.json` and the compiled
stylesheet into `dist/`.

#### Scenario: Production build emits a complete plugin folder
- **WHEN** a developer runs `npm run build`
- **THEN** `dist/main.js`, `dist/manifest.json`, and `dist/styles.css` all
  exist, and `dist/main.js` does not bundle `obsidian` or `electron` code

#### Scenario: Dev build produces inline source maps
- **WHEN** a developer runs `npm run dev`
- **THEN** `dist/main.js` includes an inline source map for debugging

### Requirement: Local vault deploy workflow
The project SHALL provide a `deploy` script that copies the built plugin
files into a local Obsidian vault's plugin directory, reading the target
path from a git-ignored `.env` file (`OBSIDIAN_PLUGIN_DIR`), with an
`.env.example` documenting the variable.

#### Scenario: Deploy without configured vault path fails clearly
- **WHEN** `npm run deploy` is executed and `.env` has no
  `OBSIDIAN_PLUGIN_DIR` set
- **THEN** the script exits non-zero with an error message naming the
  missing variable, and copies no files

#### Scenario: Deploy copies build output into the vault
- **WHEN** `npm run deploy` is executed with `OBSIDIAN_PLUGIN_DIR` set to an
  existing or creatable directory
- **THEN** `main.js`, `manifest.json`, and `styles.css` from `dist/` are
  copied into that directory

### Requirement: Lint and format tooling
The project SHALL provide `npm run lint` (ESLint flat config over
`src/ts`) and `npm run format` (Prettier) commands so TypeScript source can
be checked and auto-formatted consistently.

#### Scenario: Lint runs against TypeScript source
- **WHEN** a developer runs `npm run lint`
- **THEN** ESLint analyzes files under `src/ts` using the project's flat
  config and reports violations with a non-zero exit code, or exits zero
  when there are none

### Requirement: Automated unit test runner
The project SHALL provide `npm test` running Vitest against
`src/ts/**/*.spec.ts`, so unit tests can be added alongside source files as
features are built in later changes.

#### Scenario: Test command runs with no spec files present
- **WHEN** a developer runs `npm test` before any `*.spec.ts` files exist
- **THEN** the command completes successfully with zero tests run, rather
  than failing due to missing configuration

### Requirement: Version bump keeps manifest and package in sync
The project SHALL provide a `release:prepare` script that bumps
`package.json` and `manifest.json` versions together using semver
`major`/`minor`/`patch`, optionally committing the change.

#### Scenario: Patch bump updates both files identically
- **WHEN** a developer runs `node scripts/version.mjs patch`
- **THEN** `package.json` and `manifest.json` both report the same
  incremented patch version

### Requirement: Tag-triggered release workflow
The project SHALL provide a GitHub Actions workflow that, on push of a
version tag, installs dependencies, builds the plugin, runs the test
suite, attests build provenance for the compiled artifacts, and publishes a
GitHub release containing `main.js`, `manifest.json`, and `styles.css`.

#### Scenario: Tag push triggers a full release
- **WHEN** a tag matching the version tag pattern is pushed to the
  repository
- **THEN** the workflow builds the plugin, runs `npm test`, and creates a
  GitHub release for that tag with the three built plugin files attached

#### Scenario: Failing tests block the release
- **WHEN** the release workflow's test step fails
- **THEN** the workflow stops before creating a GitHub release
