# "Catatan pengasuhan" in the student detail looks like the other panels

Depends on: nothing beyond what is merged
Group: Mahasiswa
Kind: fix, found by "Audit: Mahasiswa"

## What we want

"Audit: Mahasiswa" asks that the panels of the student detail match from
panel to panel: order, borders and headings. Every panel of the detail is
a box with a full rounded border and a large heading: "Capaian karakter
semester (n)", "Nilai karakter (KEP-220)", "Rincian nilai SIKU",
"Riwayat pelanggaran disiplin", "Riwayat per semester", the
"Pembinaan (level)" panel, "Kesehatan jasmani" and "Kesehatan mental".
Only "Catatan pengasuhan", the last one, is different: it has no box,
just a thin line above it, and its heading is smaller, the size of the
sub-headings "Penambahan" and "Pengurangan" inside the SIKU panel. The
prototype draws "Catatan pengasuhan" in the student detail as the same
kind of panel as the others. After this work it looks like the panels
above it.

Seen in "Audit: Mahasiswa", on a local computer with sample data, as
Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi and
Pengasuh, at phone and computer width: every other panel has a 1 px
rounded border (14 px corners) and a 19 px heading. "Catatan
pengasuhan" has only a top line with square ends and a 15 px heading.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi and
Pengasuh, the roles that see "Catatan pengasuhan" in the student detail.

## What should happen

- When one of these roles opens a student's detail, from the Mahasiswa
  list or from any other list whose names open it, then "Catatan
  pengasuhan" is a box with the same border, corners, inner spacing and
  heading size as the panels above it, with the number of notes in the
  heading row as today.
- When the student has no note, then the box says "Belum ada catatan
  untuk mahasiswa ini." as today, inside the box.
- When the detail is opened on a phone, then the box is one column with
  no sideways scroll, like the other panels.
- What the panel shows, its order in the detail and who sees it do not
  change.

## Not included

- "Catatan pengasuhan" on the Pengasuhan tabs, on Profil saya and on the
  dashboard: only the panel in the student detail.
- Any change to the notes, the 20-note limit or who may read them.
- The other panels of the detail: they already match.

## Decided

1. The heading stays "Catatan pengasuhan" with the count beside it, as
   the prototype shows: "(n) catatan" on the right of the heading row,
   like "1 catatan" on "Riwayat pelanggaran disiplin".

## Steps

- [ ] 1. "Catatan pengasuhan" in the student detail uses the same panel
  box and heading as the other panels, with a check that it does.
