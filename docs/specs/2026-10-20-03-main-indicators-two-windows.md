# Main indicators saved from two windows

Depends on: nothing beyond what is merged
Group: Kurikulum
Kind: fix, found by "Audit: Kurikulum"

## What we want

When two staff change the main indicators on Kurikulum close together,
the second save writes all 24 texts over the first one, and the change
of the first is lost without anyone being told. After this work the
second save is refused and its writer is told, as a PPKS activity
already does.

Seen in "Audit: Kurikulum", on a local computer with sample data: Kepala
Unit and Pegawai UPK both opened "Ubah indikator utama" on the starting
texts. Pegawai UPK changed E1 and saved; then Kepala Unit changed E2 and
saved. Both were told "Indikator utama disimpan." E1 was then back to
its starting text "Peka dan menghargai teman dari latar belakang
berbeda": the change of Pegawai UPK was gone. The issue "Audit:
Kurikulum" asks that the second is told and nothing is lost silently.

## Who it is for

Kepala Unit and Pegawai UPK.

## What should happen

- When someone saves the main indicators after another person saved them
  since the form was opened, then nothing is saved and the message says
  "Indikator utama baru saja diubah orang lain, jadi perubahan Anda tidak
  disimpan. Muat ulang untuk melihat versi terbaru."
- When that happens, then the form stays open with what was typed, so it
  can be copied before the page is loaded again.
- When two people save the main indicators at the same moment from forms
  opened on the same texts, then one save is kept whole and the other is
  refused with that message, never a mix of the two. Confirmed by a check
  that sends two saves at once.
- When the indicators were never saved and two forms are opened on the
  starting texts, then the same holds: the first save is kept and the
  second is refused.
- When one person alone opens the form and saves, also twice in a row
  after loading the page again, then it saves as today with "Indikator
  utama disimpan."

## Not included

- Saving a Penjabaran box from two windows: it has its own issue,
  "Kurikulum: A Penjabaran box saved from two windows".
- Length limits and long words in the indicators: they have their own
  issue, "Kurikulum: Length limit and long words in the indicators".
- Any other change to the screen.

## Decisions

1. The form sends the time of the last save of the indicators it
   showed, or that none was shown. The server compares it with what is
   kept inside the same step that saves, waiting for any other save
   first, so two saves go one after the other. No new table and no new
   column.
2. A second save is never merged with the first, also when they touch
   different indicators. It is refused, as for a PPKS activity.
3. A form that sends no version at all, such as one opened before this
   change, is refused with the same message.

## Steps

- [ ] 1. A save of the main indicators made after another one since its
  form was opened is refused with its message, also at the same moment.
