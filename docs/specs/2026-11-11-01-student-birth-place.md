# Student place of birth

## What we want

The student record gets a new field, "Tempat lahir": the city or regency
where the student was born, typed freely. Staff fill it in "Formulir",
"Ubah" and "Unggah berkas" on Pengaturan > Pengguna baru mahasiswa.
"Provinsi domisili" stays as it is.

## Who it is for

Kepala Unit, Pelaksana UPK and Pengelola Asrama, the roles that already
input students, and the roles that see a student's detail.

## What should happen

- When staff open "Formulir" or press "Ubah", then they see a "Tempat
  lahir" text field with the hint "Misalnya Kota Bandung".
- When staff press "Tambah mahasiswa" or "Simpan perubahan" with Tempat
  lahir empty or longer than 60 characters, then nothing is saved and a
  message says what is wrong.
- When staff save a student with a Tempat lahir, then it is kept, and
  "Ubah" shows it again.
- When staff press "Unduh templat CSV", then the file has a "tempat
  lahir" column, with a made-up city in the example row.
- When a CSV row has Tempat lahir empty or longer than 60 characters,
  then that row is skipped, with the reason shown under "Lihat baris yang
  dilewati".
- When a CSV file has no "tempat lahir" column, then nothing is saved and
  a message says the column is missing.
- When staff look at the list "Mahasiswa yang ditambahkan", then each row
  also shows Tempat lahir.
- When anyone opens a student's detail, then it shows "Tempat lahir".
- When a student was added before this change, then their Tempat lahir
  shows "—" until someone sets it with "Ubah".
- When the preview opens, then the made-up sample students have a
  made-up Tempat lahir.

## Not included

- Changing or removing "Provinsi domisili", its filters, or how groups
  are formed.
- Filtering or counting students by Tempat lahir.
- A fixed list of cities to choose from.
- Filling in Tempat lahir for existing students all at once.

## Open questions

None.

## Steps

- [x] 1. The student record keeps Tempat lahir, and sample students get
  one.
- [x] 2. "Formulir" and "Ubah" have the Tempat lahir field, checked on
  save.
- [x] 3. "Unggah berkas" reads the Tempat lahir column, the template has
  it, and wrong rows are skipped.
- [x] 4. The list "Mahasiswa yang ditambahkan" and the student detail
  show Tempat lahir.
