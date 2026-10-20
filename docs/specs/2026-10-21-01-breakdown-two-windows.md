# A Penjabaran box saved from two windows

Depends on: nothing beyond what is merged
Group: Kurikulum
Kind: fix

## What we want

When two staff change the same box of Penjabaran MEDALI per tahap on
Kurikulum, the second save writes over the first one, and the change of
the first is lost without anyone being told. After this work the second
save is refused and its writer is told, as a PPKS activity already does.

## Who it is for

Kepala Unit and Pegawai UPK.

## What should happen

- When someone saves a Penjabaran box after another person saved the
  same box since the form was opened, then nothing is saved and the
  message says "Penjabaran ini baru saja diubah orang lain, jadi
  perubahan Anda tidak disimpan. Muat ulang untuk melihat versi
  terbaru."
- When that happens, then the form stays open with what was typed.
- When two people save the same box at the same moment from forms opened
  on the same text, then one save is kept whole (its text, its kegiatan
  acuan and its indicators together) and the other is refused with that
  message. Confirmed by a check that sends two saves at once.
- When the box was never saved and two forms are opened on its starting
  text, then the same holds: the first save is kept and the second is
  refused.
- When two people save different boxes (another nilai or another tahap),
  then both are saved.
- When one person alone opens a box and saves, also twice in a row after
  loading the page again, then it saves as today with its message.

## Not included

- Saving the main indicators from two windows: it has its own issue,
  already merged.
- Long words in a Penjabaran box: it has its own issue.
- Any other change to the screen.

## Decisions

1. The form sends the time of the last save of that box it showed, or
   that none was shown. The server compares it with what is kept inside
   the same step that saves, so two saves of one box are taken one after
   the other. No new table and no new column: the time of the last save
   is enough.
2. Saves wait for each other per box, one tahap and one nilai, not for
   the whole of Penjabaran, so saves of different boxes never wait on
   each other.
3. A second save is never merged with the first, also when they change
   different parts of the box. It is refused whole.
4. A form that sends no version at all, such as one opened before this
   change, is refused with the same message.

## Steps

- [ ] 1. A save of a Penjabaran box made after another one since its form
  was opened is refused with its message, also at the same moment.
