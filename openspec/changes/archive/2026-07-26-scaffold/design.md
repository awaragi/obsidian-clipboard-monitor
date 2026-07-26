## Context

The repo has only `proposal.md` (the product/technical proposal) and no
buildable project. The same author maintains `obsidian-hotkeys-cheatsheet`,
an existing, released Obsidian plugin with a proven scaffold: esbuild build,
flat-config ESLint, Prettier, Vitest, a `.env`-driven local-vault deploy
script, and a tag-triggered GitHub Actions release workflow. This change
scaffolds `obsidian-clipboard-monitor` by carrying that pattern over
directly rather than inventing a new one, so tooling stays consistent
across the author's plugins.

## Goals / Non-Goals

**Goals:**
- A working `npm run dev` / `npm run build` producing `dist/main.js`,
  `dist/manifest.json`, `dist/styles.css` from a no-op plugin skeleton.
- Lint, format, and test commands wired up and passing on empty/skeleton
  source.
- A local-vault deploy path (`npm run dev:deploy`) and a version/tag/release
  pipeline (`scripts/version.mjs`, `scripts/publish.mjs`,
  `.github/workflows/release.yml`) identical in shape to the reference
  project's, so releasing this plugin later requires no new process.
- `manifest.json` correctly declares `isDesktopOnly: true` from the start
  (per proposal.md §2 — mobile is unsupported, not just deferred).

**Non-Goals:**
- No clipboard-watching, editor-insertion, or settings-tab feature code —
  that begins in the next change (Build Phase 2 per proposal.md §5).
- No mobile build path, since the plugin is desktop-only by design.
- No CI beyond the release workflow (no separate lint/test-on-PR workflow
  in the reference project, so none added here either).

## Decisions

- **esbuild over webpack/rollup**: matches the reference project and the
  standard Obsidian sample-plugin convention; fast rebuilds for `npm run
  dev`. Alternative (webpack) rejected — no reason to diverge from a
  working pattern.
- **Flat ESLint config (`eslint.config.mjs`) only**: the reference project
  carries both a legacy `.eslintrc.json` and a flat `eslint.config.mjs`
  (ESLint 9 needs the flat config; the `.eslintrc.json` there is leftover
  from before the migration). This new project starts clean with only the
  flat config — no need to reproduce the leftover file.
- **Vitest over Jest**: matches the reference project; ESM-native, no extra
  transform config needed for `.mjs`/TS.
- **`scripts/version.mjs` / `scripts/publish.mjs` / `scripts/deploy.mjs`
  copied near-verbatim**: these are generic (git tag/push, `.env`-driven
  copy to `OBSIDIAN_PLUGIN_DIR`, semver bump across `package.json` +
  `manifest.json`) and contain no plugin-specific logic, so they carry over
  unchanged aside from paths.
- **Plugin id/name**: `id: "clipboard-monitor"`, `name: "Clipboard
  Monitor"` per proposal.md §3, matching the `kebab-case` id convention
  used by `hotkeys-cheatsheet`.
- **`isDesktopOnly: true` set immediately**, not deferred to a later
  change, since it's a one-line manifest fact with no dependency on
  feature code.
- **Git repo initialized as part of this change**: `scripts/publish.mjs`
  and the release workflow assume git tags/remote exist. The directory
  isn't a git repo yet, so `git init` (plus an initial commit) is part of
  implementation, not assumed pre-existing.

## Risks / Trade-offs

- [Reference project's scripts assume a `git` remote is already configured]
  → out of scope for this change to configure a remote; `scripts/publish.mjs`
  will simply fail with a clear git error until one exists, same as it
  would in the reference project without a remote.
- [`actions/attest-build-provenance` in the release workflow requires the
  repo to be on GitHub with appropriate Actions permissions] → no action
  needed now; the workflow only runs on tag push, so it's inert until the
  first release is actually cut.
- [Copying scripts verbatim risks silently carrying over stale
  plugin-specific values if not re-checked] → tasks.md will call out every
  file that needs the `hotkeys-cheatsheet` → `clipboard-monitor` name/id
  substitution explicitly.

## Migration Plan

Net-new scaffold — no existing users or deployed state to migrate.
Implementation order: manifest/package metadata → build config → lint/
format/test config → scripts → CI workflow → minimal `src/` skeleton →
`git init` + first commit. Rollback is simply deleting the change's files;
nothing is deployed until a tag is pushed.

## Open Questions

None — naming, manifest flags, and tooling choices are all resolved by
proposal.md and by mirroring the reference project.
