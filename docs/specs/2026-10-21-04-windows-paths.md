# Checks pass on Windows

## What we want

Some checks find the screen parts of the app and compare where each file
lives against a written-out place. On Windows the app writes those places
with `\`, while the checks expect `/`, so about 13 checks fail on a Windows
computer although nothing in the app is wrong. On Linux they pass. We want
them to pass on both.

## Who it is for

- Anyone who runs the checks on a Windows computer. No role in the app
  sees a change.

## What should happen

- When someone runs the checks on Windows, then every "screen parts … that
  run in the browser" check passes, and so do the dorm and guidance screen
  layout checks.
- When the PR's checks run on GitHub (Linux), then they all still pass.
- When any role uses the app on the preview, then nothing looks or works
  differently.

## Not included

- Checks that fail on Windows for another reason. They are suggested as
  new work.
- Any change to the screens, the data or the checks themselves.

## Open questions

None.

## Steps

1. [ ] The helper that finds the screen parts always writes file places
   with `/`, so the same checks pass on Windows and Linux.
