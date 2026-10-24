# Health list on Dashboard asrama on a phone

Depends on: none
Group: Asrama
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

On Dashboard asrama, in "Kesehatan jasmani penghuni", the list
"Perlu perhatian dan tindak lanjut medis" breaks on a phone:

- At 320, 360 and 375 px the page scrolls sideways: each resident's row
  is 336 px wide and the page 377 px, because the label "Perlu tindak
  lanjut medis · berdasarkan catatan kesehatan" is kept on one line.
- At 430 px the label fits on the line, and the resident's name, room
  and history are squeezed into a column 0 to 55 px wide; one row
  becomes 3,019 px tall.

Seen as Kepala Unit, Pengelola Asrama and BAM with the sample data.

## Who it is for

The roles that see the health panels on Dashboard asrama: Kepala Unit,
Direktur, Pengelola Asrama and BAM.

## What should happen

- When the list shows at 320, 360, 375, 390 or 430 px, then the page
  does not scroll sideways and no row is wider than its card.
- When the label does not fit beside the resident, then it wraps or
  sits on its own line above the resident's name.
- When a row shows at any width, then the resident's name, room and
  history are at least as wide as the label, never squeezed to a strip.
- On a computer the list looks as today.

## Not included

- Which residents show in the list or what the labels say.
- The other panels of Dashboard asrama.

## Decisions

1. On a phone the label goes on its own line above the resident, as
   other lists of the app do with a long status.
2. On a computer the resident stays beside the label while they take at
   least the width of one column of the dashboard beside it, which is
   wider than the longest label; in a card narrower than that, such as
   Kepala Unit's half-width card, they move under the label instead of
   being squeezed.
3. The rows of the other lists on Dashboard asrama, such as the residents
   on leave, keep their own layout: only the health list changes.

## Steps

- [x] 1. The label of a resident in the health list wraps and goes on its
  own line on a phone, and the resident's name, room and history keep
  their width at any width.
