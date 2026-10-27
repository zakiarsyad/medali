# Readable status badges in dark mode

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found while building "Groundwork: One shared set of UI values"

## What we want

When a phone or computer is set to dark mode, the app turns its
background dark, but the green, amber and red of the status badges stay
as they are in light mode. On the dark background their text is too
pale to read: green reaches 3.25 to 1, amber 3.58 to 1 and red 2.78 to
1, while small text needs 4.5 to 1. After this work every badge in dark
mode reaches 4.5 to 1, and the shared check of the badge colours also
checks dark mode.

## Who it is for

Every role that sees a status badge with dark mode on.

## What should happen

- When dark mode is on and a "good", "warning" or "bad" badge shows,
  then its text reaches a contrast of at least 4.5 to 1 on its
  background. Confirmed by a check.
- When dark mode is on and a "plain" badge shows, then the same holds.
  Confirmed by a check.
- When dark mode is off, then badges look as before.
- Badges keep their words.

## Not included

- Charts, bars and medal colours in dark mode.
- Any other part of dark mode.

## Decisions

1. Only the badge colours get a dark mode value, in the shared set of
   values; the general green, amber and red stay as they are, so charts
   do not change.
2. Each dark mode badge colour is the light one made lighter, the least
   that reaches 4.5 to 1 on the dark background, so its meaning stays
   clear.
3. Decided while building: the "plain" badge already reaches 7.40 to 1
   in dark mode, so it keeps its colours.
4. Decided while building: the solid red badge, for the heaviest step,
   had dark text on red in dark mode, 2.78 to 1. It keeps the white text
   it has in light mode, which reaches 5.85 to 1, so every badge reads.
5. Decided while building: the borders of the badges keep their colours,
   as the issue asks only about the text.

## Steps

- [ ] 1. Dark mode text colours for the badges that need them, with the
  shared check of the badge colours run in dark mode too.
