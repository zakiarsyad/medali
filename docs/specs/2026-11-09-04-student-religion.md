# Student religion

## What we want

The student record gets a new field, "Agama". On Pengaturan > Pengguna
baru mahasiswa, staff fill in Agama both in "Formulir" (one student at a
time) and in "Unggah berkas" (many students from one CSV file).

## Who it is for

Kepala Unit, Pelaksana UPK and Pengelola Asrama, the roles that already
input students.

## What should happen

- When staff open "Formulir", then they see an "Agama" field with the
  choices Islam, Kristen, Katolik, Hindu, Buddha and Konghucu.
- When they press "Tambah mahasiswa" without choosing Agama, then nothing
  is saved and a message asks them to choose one.
- When they press "Ubah" on a row, then Agama shows what was saved, and
  "Simpan perubahan" saves a change to it.
- When they press "Unduh templat CSV", then the file has an "Agama"
  column, with a made-up value in the example row.
- When a CSV row has Agama empty or outside the six choices, then that row
  is skipped, with the reason shown under "Lihat baris yang dilewati".
- When a CSV file has no "Agama" column, then nothing is saved and a
  message says the column is missing.
- When they look at the list "Mahasiswa yang ditambahkan", then each row
  also shows Agama.
- When a student was added before this change, then their Agama shows as
  "—" until someone sets it with Ubah.
- When the preview opens, then the made-up sample students have a made-up
  Agama.

## Not included

- Showing Agama anywhere other than this page, such as the student
  detail, Profil saya or reports.
- Filling in Agama for existing students all at once.

## Open questions

None.

## Steps

- [x] 1. The student record keeps Agama, and sample students get one.
- [x] 2. "Formulir" and Ubah have the Agama field, checked on save.
- [x] 3. "Unggah berkas" reads the Agama column, the template has it, and
  wrong rows are skipped.
- [x] 4. The list "Mahasiswa yang ditambahkan" shows Agama.
