# New student input

## What we want

Pengaturan > Pengguna baru mahasiswa gets its content, built like the
prototype. Staff add a student who is not in the records yet, one at a
time through a form. The student gets an account straight away and shows
in a list on the same page, where they can be changed or removed.

## Who it is for

Kepala Unit, Pelaksana UPK and Pengelola Asrama.

## What should happen

- When one of the three roles opens the tab, then they see the title and
  intro text from the prototype, the numbers "Total mahasiswa" and
  "Ditambahkan lewat menu ini", the "Input data mahasiswa" form, and the
  list "Mahasiswa yang ditambahkan".
- When they look at the form, then it has the prototype's fields: NIM,
  Nama lengkap, Program studi, Jalur, Jenis kelamin, Angkatan (this year
  and the five before), Kelas akademik (optional), Provinsi domisili,
  Status and Kategori (Afirmasi, Pembibitan, Internasional, Blended
  learning). Instansi asal shows only when Jalur is Alih program.
- When they press "Tambah mahasiswa" with valid data, then the student is
  saved, gets an account with the Mahasiswa role, appears at the top of
  the list and in Ganti peran, and a message confirms it.
- When the NIM is not 10 digits, is already used, or the name is shorter
  than 3 letters, then nothing is saved and the prototype's message says
  why.
- When they look at the list, then each row shows name, NIM, jenis
  kelamin, kategori, program studi, jalur, kelas, angkatan, status, and
  who added it and when. Only students added through this tab are listed;
  the newest is first.
- When they type in "Cari nama atau NIM", then the list narrows to
  matches.
- When they press "Ubah" on a row, then the form fills with that student,
  the NIM cannot be changed, and "Simpan perubahan" saves it.
- When they press "Hapus" and confirm, then the student leaves the list
  and Ganti peran, but is not erased: the record is marked with who
  removed it and when. Confirmed by a check.
- When a role without this right sends an add, change or remove, then the
  server refuses it. Confirmed by a check.

## Not included

- Unggah berkas (next spec).
- Kelompok pengasuhan in the form and the list, the Asrama column, the
  numbers "Penghuni asrama" and "Belum punya kelompok pengasuhan", and the
  semester, tahap and asrama note. They come with Pengasuh and Asrama.

## Open questions

None.

## Steps

- [ ] 1. The student record keeps who added it, when and how, and a
  removal mark.
- [ ] 2. The right to input new students is added to the permission list
  for the three roles, with its checks.
- [ ] 3. The tab shows the title, the two numbers and the list with
  search.
- [ ] 4. The form adds a student with their account.
- [ ] 5. Ubah and Hapus work from the list.
