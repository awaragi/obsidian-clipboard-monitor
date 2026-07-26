## 1. Types

- [x] 1.1 Add `formatLabel: string | null` to `WatchModeStatus` in
      `src/ts/watchMode/types.ts`.

## 2. Controller

- [x] 2.1 In `src/ts/watchMode/watchModeController.ts#start()`, pass
      `formatLabel: format.name` in the `host.onStatusChange(...)` call.
- [x] 2.2 In `stop()`, pass `formatLabel: null`.
- [x] 2.3 Update `watchModeController.spec.ts`'s assertions on
      `onStatusChange` calls to include the new field for both the
      running and stopped cases.

## 3. Status bar rendering

- [x] 3.1 In `src/ts/main.ts#renderStatus`, include `status.formatLabel`
      in the running-state status text (target — scope — format), e.g.
      `` `Clipboard Monitor: ${status.targetName} — ${status.scopeLabel} — ${status.formatLabel}` ``.
      No change to the stopped-state text.
- [x] 3.2 Update the initial `renderStatus` call in `onload()` to include
      `formatLabel: null`.

## 4. Verification

- [x] 4.1 Run `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm
      test` and confirm all pass.
- [ ] 4.2 Manually verify in the test vault (`npm run dev:deploy`): start
      watch mode with a non-default format and confirm the status bar
      shows the target, scope, and format name; stop watch mode and
      confirm it reverts to "Clipboard Monitor: off".
