## 1. Manifest and package metadata

- [x] 1.1 Create `manifest.json` with `id: "clipboard-monitor"`,
      `name: "Clipboard Monitor"`, `version: "0.1.0"`,
      `minAppVersion: "1.0.0"`, `description`, `author`, and
      `isDesktopOnly: true`.
- [x] 1.2 Create `package.json` with `name: "obsidian-clipboard-monitor"`,
      matching `version: "0.1.0"`, `main: "main.js"`, and scripts: `dev`,
      `build`, `deploy`, `dev:deploy`, `dev:deploy:watch`, `clean`, `lint`,
      `format`, `test`, `release:prepare`, `release`.
- [x] 1.3 Add devDependencies: `esbuild`, `typescript`, `obsidian` (latest),
      `@types/node`, `eslint`, `@eslint/js`, `@typescript-eslint/eslint-plugin`,
      `@typescript-eslint/parser`, `prettier`, `vitest`, `watch`.
- [x] 1.4 Run `npm install` and verify `package-lock.json` is generated.

## 2. Build configuration

- [x] 2.1 Create `tsconfig.json` (ES2018 target, ESNext module, bundler
      resolution, strict mode, `include: ["src/ts/**/*.ts"]`).
- [x] 2.2 Create `esbuild.config.mjs` bundling `src/ts/main.ts` to
      `dist/main.js`, externalizing `obsidian`, `electron`, CodeMirror
      packages, and Node builtins; inline sourcemaps in dev, none in
      production; copies `manifest.json` and `src/css/styles.css` into
      `dist/` after build.
- [x] 2.3 Create `src/ts/main.ts` — minimal `Plugin` subclass (empty
      `onload`/`onunload`) as the scaffold entry point.
- [x] 2.4 Create `src/css/styles.css` (empty placeholder file).
- [x] 2.5 Run `npm run build` and verify `dist/main.js`,
      `dist/manifest.json`, `dist/styles.css` are produced.
- [x] 2.6 Run `npm run dev`, confirm inline source map is present in
      `dist/main.js`, then stop the watcher.

## 3. Lint, format, and test tooling

- [x] 3.1 Create `eslint.config.mjs` (flat config: `js.configs.recommended`
      + `@typescript-eslint` recommended rules over `src/ts/**/*.ts`,
      ignoring `dist/`, `node_modules/`, `**/*.mjs`, `scripts/`).
- [x] 3.2 Create `.prettierrc` (semi, double quotes, es5 trailing commas,
      100 print width, 2-space indent).
- [x] 3.3 Create `vitest.config.ts` (`environment: "node"`,
      `include: ["src/ts/**/*.spec.ts"]`).
- [x] 3.4 Run `npm run lint` and confirm it exits zero against the
      scaffold source.
- [x] 3.5 Run `npm test` and confirm it exits zero with zero tests found.

## 4. Local deploy and release scripts

- [x] 4.1 Create `.env.example` documenting `OBSIDIAN_PLUGIN_DIR`.
- [x] 4.2 Create `.gitignore` (node_modules, dist/build output, `.env`,
      `.DS_Store`, editor dirs, test vault).
- [x] 4.3 Create `scripts/deploy.mjs` — reads `OBSIDIAN_PLUGIN_DIR` from
      `.env`, errors clearly if unset, otherwise copies `dist/main.js`,
      `dist/manifest.json`, `dist/styles.css` into that directory.
- [x] 4.4 Create `scripts/version.mjs` — exports `currentVersion()` and
      `bumpVersion(type, { commit })`, bumping `package.json` and
      `manifest.json` versions together; runnable standalone via
      `node scripts/version.mjs <major|minor|patch> [--commit]`.
- [x] 4.5 Create `scripts/publish.mjs` — verifies no uncommitted changes to
      `package.json`/`manifest.json`, verifies the version tag doesn't
      already exist, then pushes, tags, and pushes the tag.
- [x] 4.6 Verify `npm run deploy` fails with a clear error when `.env` is
      absent/unset (no `dist/` copy attempted).

## 5. CI release workflow

- [x] 5.1 Create `.github/workflows/release.yml` — triggers on pushed
      version tags (`[0-9]*.*`), installs deps, builds, runs `npm test`,
      attests `dist/main.js` and `dist/styles.css` as build provenance,
      then creates a GitHub release attaching `dist/main.js`,
      `dist/manifest.json`, `dist/styles.css`.

## 6. Repo bootstrap and docs

- [x] 6.1 Run `git init` in the project root (repo is not yet a git
      repository) and create an initial commit of the scaffold.
- [x] 6.2 Create `README.md` with plugin name, one-line description (from
      proposal.md §1), and a short "Development" section covering
      `npm install`, `npm run dev`, `.env` setup, and `npm run deploy`.
- [x] 6.3 Add a `LICENSE` file (MIT, matching the reference project).

## 7. Verification

- [x] 7.1 Run `npm run build`, `npm run lint`, `npm test` together and
      confirm all three succeed from a clean `npm install`.
- [x] 7.2 Confirm `dist/manifest.json` contains `"isDesktopOnly": true`
      after a build.
