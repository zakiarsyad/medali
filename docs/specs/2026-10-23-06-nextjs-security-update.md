# Next.js version with known security holes

Depends on: nothing beyond what is merged
Group: Groundwork
Kind: fix, found while building "Asrama: Own leave and cleaning of a
resident who is also BAM"

## What we want

The app is built on Next.js 16.4.0, the version the lock file holds. A
check of the app's packages against the public list of known security
problems names three for Next.js 16.0.0 up to 16.4.0, all fixed in 16.4.1:

- critical: running code on the server without signing in, through the
  image service, when SVG files are used (GHSA-2464-fhr4-w9xw),
- critical: running code on the server without signing in, through cached
  functions that return typed arrays (GHSA-673q-mjm6-r5xr),
- high: stopping the app from answering, through server actions
  (GHSA-p3m5-59mp-jv5r).

Starting the app on a local computer also shows a Next.js message that
this version has a known security problem. After this work the app runs a
Next.js version with none of these problems, and works as before.

## Who it is for

Everyone who uses the app, and the owner of the hosting and the campus
server.

## What should happen

- When the app's packages are checked against the public list of known
  security problems, then Next.js has no critical or high problem.
  Confirmed by running the package check.
- When the app is started on a local computer, then Next.js shows no
  message about a known security problem.
- When the full set of checks runs, then every check passes, as before.
- When the app is opened with sample data, then signing in with "Masuk
  sebagai", the menu and a few pages of each menu group work as before.

## Not included

- Moving to a new major version of Next.js.
- Updating any other package, unless the new Next.js version needs it.
- Any change to what a page shows or who may see it.

## Decided

1. The version is 16.4.2, the newest 16.x release, which the package check
   names as having none of these problems.
2. It is updated with the project's package manager, so the lock file
   changes with it. The lowest allowed version in the package list moves
   to 16.4.2 as well. The app uses no other package that Next.js says must
   match its version, such as its lint rules, so nothing else moves.
3. If the new version breaks a check or a page, only what the update breaks
   is fixed, in the same PR, and written under "known gaps".

## Steps

- [ ] 1. Update Next.js to a version with no known critical or high
  security problem, with the full checks and the package check passing.
