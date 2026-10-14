# Length limits on a staff account

Kind: fix, found by "Audit: Pengaturan"

Depends on: nothing beyond what is merged

## What we want

"Tambah pengguna" on Pengaturan > Pengguna dan peran takes a name, a
gelar and a unit of any length. After this work each has a longest
length, checked by the server, and a long word no longer pushes the
list off the screen.

Seen in "Audit: Pengaturan", on a local computer with sample data, as
Kepala Unit:

- The form has no longest length for "Nama lengkap", "Gelar" and "Unit
  atau jabatan", and the server checks none. A request sent by hand with
  a name of 5,000 letters was saved.
- With that account in the list, Pengguna dan peran at a computer width
  of 1366 became 47,111px wide: the whole page scrolls sideways, and
  "Edit peran" of that row opens a form 46,901px wide.
- "Unit atau jabatan" is changed in "Edit peran" as well, with no
  longest length there either.
- The student form on Pengguna baru mahasiswa already has such limits:
  the name is 100 characters at most.

## Who it is for

Kepala Unit.

## What should happen

- When Kepala Unit saves a new account with a name longer than 100
  characters, then nothing is saved and the message says "Nama paling
  banyak 100 karakter."
- When the gelar is longer than 50 characters, then nothing is saved
  and the message says "Gelar paling banyak 50 karakter."
- When the unit or jabatan is longer than 100 characters, in "Tambah
  pengguna" or in "Edit peran", then nothing is saved and the message
  says "Unit atau jabatan paling banyak 100 karakter."
- When Kepala Unit types in these boxes, then the box takes no more
  than its longest length.
- When a request sent by hand is longer than a limit, then the server
  refuses it with the same message. Confirmed by a check.
- When a name, a gelar or a unit is one long word with no blank, then
  it wraps inside its column or its card, on a phone and on a computer,
  and the page does not scroll sideways. The same holds in "Edit peran"
  and on "Ganti peran".
- Lengths are counted after the blanks around the text are taken off,
  as today.

## Not included

- Accounts saved before this work. The sample data holds none over the
  limits, and no table change is made.
- NIP and email, which are checked already.
- The student form and the file upload, which have their limits.

## Decided

1. The limits: name 100, as for a student; gelar 50; unit or jabatan
   100. The longest in the sample data are 18, 16 and 40.
2. The limits are named once beside the other checks of a new account,
   and used by the form and by the server.

Decided while building, because the issue did not say:

3. A long word also folds in two more places that show the same name on
   the same screens: the message after "Simpan pengguna", which names
   the new account, and the box "Masuk sebagai" in the menu, when the
   account itself is signed in.
4. In the staff list on a computer a long word folds inside its column,
   and the list stays as wide as its box wherever the usual rows fit it,
   such as at a width of 1366. Rows of a usual length keep their look.
   On a narrower computer window the list was already wider than its
   box with usual rows, and scrolls sideways inside that box; it still
   does.
5. Two faults seen on the same screen are not part of this work, and
   each has its own issue: "Groundwork: Unseen column title that makes
   the whole page scroll sideways", which shows when a list is wider
   than its box, and "Pengaturan: The choice Peran on a very narrow
   phone", which makes the page 4px wider than a phone of 320.
6. The command that adds the first account of an empty app is not
   changed. It is not "Tambah pengguna", and it takes a name only from
   the person who runs the server.

## Steps

- [x] 1. The server refuses a name, a gelar or a unit over its limit,
  for a new account and for "Edit peran", and the boxes take no more.
- [x] 2. A long word wraps in the staff list, in "Edit peran" and on
  "Ganti peran".
