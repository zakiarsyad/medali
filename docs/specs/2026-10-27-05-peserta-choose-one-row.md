# Peserta choice in the shared choose-one row

Depends on: Groundwork: One choose-one button row
Group: Kegiatan
Kind: fix, found while building "Groundwork: One choose-one button row"

## What we want

"Groundwork: One choose-one button row" gave every choose-one row on
Penilaian, Kurikulum and Pengaturan one look: a light grey track, 40 px
tall, 15 px text, the chosen button white with navy text. The "Peserta"
choice on the form of a schedule on Kegiatan › Kegiatan tambahan (Per
mahasiswa, Per kelas, Per angkatan, Lintas angkatan) is also a
choose-one row, but that issue did not name it, so it still has the old
look: separate buttons with a border, 13 px, the chosen one navy.

## Who it is for

The roles that schedule extra activities on Kegiatan › Kegiatan
tambahan.

## What should happen

- When the "Peserta" choice shows on the schedule form, then it has the
  same look as the choose-one rows on Penilaian, Kurikulum and
  Pengaturan: the same text size, height, corners, border and colours,
  and the chosen button stands out the same way.
- When a choice is pressed, then it works as today: the picks below
  change to that kind and only its picks are sent.
- The choices keep their words and order, and the word "Peserta" stays
  shown above the row as the field's label.

## Not included

- The angkatan buttons under Per angkatan and Lintas angkatan, where
  more than one can be picked; they are not a choose-one row.
- The filter chips on Asrama and Pengasuh › Ganti.
- Tap sizes on a phone, which have their own issue.

## Decisions

1. The row uses the same shared choose-one row as the other screens,
   so the look is kept in one place.
2. "Peserta" stays a visible label above the row, as today, because on
   this form every field has a visible label.
3. Decided while building: "Peserta" names the whole part, the row with
   the picks and the "Sasaran" count below it. A reader of the screen
   hears the row itself named "Jenis peserta", as the other screens name
   their row by what it chooses.

## Steps

- [ ] 1. The Peserta choice uses the shared choose-one row, under the
  visible label "Peserta", with a check.
