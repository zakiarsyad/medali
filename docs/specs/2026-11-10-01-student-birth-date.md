# Student date of birth

## What we want

The student record gets a new field, "Tanggal lahir", written as
MM/DD/YYYY (month/day/year). On Pengaturan > Pengguna baru mahasiswa,
staff fill it in both in "Formulir" (one student at a time) and in
"Unggah berkas" (many students from one CSV file).

## Who it is for

Kepala Unit, Pelaksana UPK and Pengelola Asrama, the roles that already
input students.

## What should happen

- When staff open "Formulir", then they see a "Tanggal lahir" text field
  with the hint "MM/DD/YYYY".
- When they press "Tambah mahasiswa" with Tanggal lahir empty, not in
  MM/DD/YYYY, a date that does not exist (such as 02/30/2005) or a date in
  the future, then nothing is saved and a message says what is wrong.
- When they press "Ubah" on a row, then Tanggal lahir shows what was saved
  as MM/DD/YYYY, and "Simpan perubahan" saves a change to it.
- When they press "Unduh templat CSV", then the file has a "Tanggal lahir"
  column, with a made-up date in MM/DD/YYYY in the example row.
- When a CSV row has Tanggal lahir empty or not a real date in MM/DD/YYYY,
  then that row is skipped, with the reason shown under "Lihat baris yang
  dilewati".
- When a CSV file has no "Tanggal lahir" column, then nothing is saved and
  a message says the column is missing.
- When they look at the list "Mahasiswa yang ditambahkan", then each row
  also shows Tanggal lahir as MM/DD/YYYY.
- When a student was added before this change, then their Tanggal lahir
  shows as "—" until someone sets it with Ubah.
- When the preview opens, then the made-up sample students have a made-up
  Tanggal lahir.

## Not included

- Showing Tanggal lahir anywhere other than this page, such as the student
  detail, Profil saya or reports.
- Filling in Tanggal lahir for existing students all at once.
- A calendar picker: the browser's own picker shows the date in the order
  of the computer's settings, so it cannot promise MM/DD/YYYY.

## Open questions

None.

## Steps

- [x] 1. The student record keeps Tanggal lahir, and sample students get
  one.
- [x] 2. "Formulir" and Ubah have the Tanggal lahir field, checked on save.
- [x] 3. "Unggah berkas" reads the Tanggal lahir column, the template has
  it, and wrong rows are skipped.
- [x] 4. The list "Mahasiswa yang ditambahkan" shows Tanggal lahir.
