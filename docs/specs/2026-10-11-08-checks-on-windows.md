# Checks on Windows

## What we want

The checks pass on GitHub but fail on a Windows computer: the style check
reports 206 errors and two tests fail. None of these is a fault in the
app. They come from how Windows stores the end of a line and writes folder
paths. We want the same checks to pass on Windows, without changing what
they check.

## Who it is for

People who work on this repo on a Windows computer. No role in the app is
affected.

## What should happen

- When someone on Windows gets a fresh copy of the repo and runs all the
  checks, then every check passes. Confirmed by running them on Windows.
- When someone on Windows who already has the repo says "set up", then
  their files are refreshed and every check passes.
- When someone on Windows saves a file with Windows line ends and commits
  it, then the repo stores it with the standard line ends.
- When the checks run on GitHub, then they all still pass and still check
  the same things.
- When anyone opens the preview, then nothing looks or behaves
  differently.

## Not included

- Running the checks on Windows on GitHub. A Windows user sees a failure
  on their own computer.
- Any change to the app's screens or data.

## Open questions

None.

## Steps

- [x] 1. The repo keeps the same line ends on every computer, and the
  stored files are refreshed to match.
- [ ] 2. The check that lists the source files writes paths the same way
  on every computer.
- [ ] 3. "Set up" refreshes the files on a computer that already has the
  repo.
