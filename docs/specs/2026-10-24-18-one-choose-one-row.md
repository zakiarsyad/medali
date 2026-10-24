# One choose-one button row

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

A row of buttons where you pick one of a few choices has three
different looks:

- "Satu mahasiswa / Unggah berkas / Formulir kolektif" on Penilaian ›
  Asesmen, Jasmani, SKPM and SIKU and on Pengaturan › Pengguna baru
  mahasiswa: white, navy text, 15 px, 31 px tall.
- The choices on Kurikulum: light navy background, 13 px, square
  corners.
- The choices on Penilaian › SIKU (Penambahan / Pengurangan): navy
  background, 13 px, a border and 8 px corners.

## Who it is for

Kepala Unit, Pegawai UPK and the roles that fill Penilaian, Kurikulum
and Pengaturan.

## What should happen

- When a choose-one row shows on any of these screens, then it has one
  look: the same text size, height, corners, border and colours, and
  the chosen button stands out the same way.
- When a choice is pressed, then it works as today.
- The choices keep their words and order.

## Not included

- The filter chips on Asrama and Pengasuh › Ganti, which are filters,
  not a choose-one row.
- Tap sizes on a phone, which have their own issue.

## Decisions

1. The look kept is the one on Penilaian's upload choice, because five
   screens use it, with the field height from the shared set.
2. Decided while building: the whole row is as tall as a form field,
   40 px, and its buttons take the field's text size, 15 px, so the
   row lines up with the fields and buttons beside it.
3. Decided while building: Kurikulum's "Semester ganjil / Semester
   genap" and SIKU's "Penambahan / Pengurangan" use the same shared row
   as the upload choice, so the look is kept in one place. A reader of
   the screen hears the row named by what it chooses: "Cara input",
   "Semester" and "Jenis".
4. Decided while building: the Tahap boxes on Kurikulum are large
   cards, not a row of buttons, and keep their look.
5. Decided while building: the "Peserta" choice on Kegiatan (Per
   angkatan, Lintas angkatan and the others) is not on the screens this
   issue names, so it keeps its look here and has its own issue.

## Steps

- [x] 1. The shared choose-one row is as tall as a form field, takes
  the field's text size, and is named by the screen that uses it, with
  a check.
- [x] 2. Kurikulum's semester choice uses the shared row.
- [x] 3. SIKU's Penambahan / Pengurangan choice uses the shared row.
