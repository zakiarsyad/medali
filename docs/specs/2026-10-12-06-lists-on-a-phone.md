# Lists with their buttons on a phone

Kind: fix, found by "Audit: UI of the merged screens"

## What we want

On a phone, four merged lists show only their first one or two columns.
The rest, with the buttons of each row, sits to the right behind a
sideways scroll inside the list, and nothing on screen says it is there.
After this work every value and every button of a row can be seen on a
phone without scrolling sideways.

What happens today, at a phone width of 390, on the preview of `main` and
on a local computer:

- Pengaturan > Pengguna dan peran, as Kepala Unit: the staff list shows
  the name and the start of "Peran". "Unit atau jabatan", "Keterangan",
  "Edit peran" and "Hapus" are out of view.
- Pengaturan > Pengguna baru mahasiswa, as Kepala Unit, Pegawai UPK and
  Pengelola Asrama: in "Mahasiswa yang ditambahkan", "Status", "Diinput",
  "Ubah" and "Hapus" are out of view.
- Kurikulum, as Kepala Unit and Pegawai UPK: in Program kegiatan PPKS,
  "Ubah" is out of view.
- Mahasiswa, as Kepala Unit and Direktur / Wakil Direktur: "Angkatan" is
  cut and "Provinsi" is out of view.

## Who it is for

Every role that opens one of these four lists on a phone.

## What should happen

- When one of these four lists is opened at phone width, then each row
  shows all its values one under another, each with the title of its
  column, and the list does not scroll sideways.
- When a row has buttons ("Edit peran", "Ubah", "Hapus"), then they show
  at the end of that row, in the same order as on a computer.
- When a role only reads the list, then no empty place is left where a
  button would be.
- When the page is opened at computer width, then the four lists look as
  they do today.
- When the page is opened at phone width, then the page itself still does
  not scroll sideways.

## Not included

- "Hak akses tiap peran": it already fits a phone.
- The row of tabs under a page title.
- Any change to what a list holds or to who may see it.

## Decided

1. A row shows on a phone as one block per row with its values stacked,
   made once in the shared list style so all four lists get it, and any
   later list too.

Decided while building, because the issue did not say:

2. A list asks for the stacked view by name. The other lists that share
   the list style keep their look: "Hak akses tiap peran", which is not
   included, and the grade scale and the preview of an uploaded file,
   which the issue does not name.
3. Phone width is the width where the side menu already folds away, so
   the app changes shape at one width only.
4. On a phone the buttons of a row start at the left edge, under the
   values, in every list.
5. A check fails when a list that asks for the stacked view has a column
   whose title its rows do not carry.
6. On a phone a value that a row does not have takes no line: a staff
   member with nothing under "Keterangan" shows no "Keterangan" line. A
   value shown as "-" on a computer still shows as "-".

## Steps

- [x] 1. The shared list style shows each row as a stacked block at phone
  width, with the column title beside each value.
- [x] 2. The four lists carry their column titles for that view, and
  their buttons show at the end of each row.
