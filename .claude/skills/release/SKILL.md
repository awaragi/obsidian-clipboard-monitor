---
name: release
description: Cut a release of this plugin (obsidian-clipboard-monitor) — bump the version with npm run release:prepare, commit, then tag and push with npm run release. Use when the user asks to "release", "cut a release", "create a patch/minor/major release", or "publish a new version".
license: MIT
metadata:
  author: Pierre Awaragi
  version: "1.0"
---

Cuts a release of this Obsidian plugin using the repo's own release scripts (`scripts/version.mjs`, `scripts/publish.mjs`). Do not hand-edit `package.json`/`manifest.json` version fields — always go through `npm run release:prepare`.

**Input**: A release type — `patch`, `minor`, or `major`. If the user didn't specify one, ask (default to `patch` for bug/lint fixes, `minor` for new features, `major` for breaking changes) rather than guessing silently.

**Steps**

1. **Check the working tree is otherwise clean before bumping.**

   Run `git status --porcelain`. Any changes staged/unstaged that are meant to ship in this release (e.g. the fix the user just had you make) should already be committed with their own descriptive commit *before* you bump the version — the version bump is its own commit, not bundled with feature/fix work. If there's uncommitted work the user wants included, commit it first (following the repo's normal commit-message conventions) and confirm with the user if it's unclear whether it belongs in this release.

2. **Run the full verification suite before bumping.**

   ```bash
   npm run typecheck && npm run lint && npm run test && npm run build
   ```

   All four must pass. Do not proceed to a version bump on a red build — fix or ask the user how to proceed.

3. **Bump the version.**

   ```bash
   node scripts/version.mjs <patch|minor|major> --commit
   ```

   This updates `package.json` and `manifest.json` and creates a `chore: bump version to X.Y.Z` commit. (Equivalent to `npm run release:prepare -- <type> --commit`, but invoke the script directly since `release:prepare`'s npm passthrough for extra args can be finicky across npm versions — verify `git log -1` shows the bump commit either way.)

4. **Confirm before pushing.**

   `npm run release` pushes the current branch to `origin` (main branch push), creates a git tag matching the new version, and pushes that tag — this is a real, hard-to-reverse action visible to anyone watching the repo (and may trigger CI/publish automation). Tell the user the exact version about to ship and get an explicit go-ahead before running it, unless they already gave blanket authorization for this release in their request.

5. **Release.**

   ```bash
   npm run release
   ```

   This runs `scripts/publish.mjs`, which refuses to proceed if `package.json`/`manifest.json` have uncommitted changes or if the version's tag already exists — treat either of those errors as a stop-and-report condition, not something to force past.

6. **Report the result**: the new version number, the commit(s) created, and confirmation the tag was pushed. Mention that `npm run release:prepare patch` is the next step whenever a new release cycle starts.

**Notes**

- Never use `git tag -f`, `git push --force`, or delete/recreate an existing tag to work around a "tag already exists" error — that means a release with this version was already cut; ask the user what they actually want (probably the *next* version).
- Never skip the verification suite (step 2) to save time, even for a "trivial" release.
