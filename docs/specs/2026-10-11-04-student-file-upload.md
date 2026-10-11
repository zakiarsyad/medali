# Student file upload

## What we want

Pengaturan > Pengguna baru mahasiswa gets a second way to put in students:
"Unggah berkas", next to "Formulir", built like the prototype. Staff upload
one CSV file with one student per row, see which rows are ready and which
are skipped, and save the ready ones in one go.

This builds on the form from the spec "New student input", and waits until
that work is merged.

## Who it is for

Kepala Unit, Pegawai UPK and Pengelola Asrama.

## What should happen

- When one of the three roles opens the tab, then "Input data mahasiswa"
  has two choices, "Formulir" and "Unggah berkas". Formulir works as
  before.
- When they choose "Unggah berkas", then they see the list of columns, the
  notes on how to fill them, the button "Unduh templat CSV", and a place to
  pick or drop a file.
- When they press "Unduh templat CSV", then they get a CSV file with the
  column titles and one made-up example row.
- When they pick a CSV file, then nothing is saved yet. They see how many
  rows are ready, the first rows as a preview, how many rows are skipped,
  and under "Lihat baris yang dilewati" each skipped row with its row
  number and reason.
- When a row breaks a rule of the form (NIM, name, program studi, jalur,
  jenis kelamin, angkatan, provinsi, instansi asal, status), then it is
  skipped with the prototype's message for that rule.
- When a row's NIM is already registered, then it is skipped with "NIM
  sudah terdaftar". An upload never changes a student who is already
  there.
- When the same NIM is in the file twice, then the last row is used and
  the count says so.
- When they press "Simpan … baris", then every ready row becomes a student
  with an account, exactly as from the form, a message says how many were
  saved, and the list shows them with the file name under "Diinput".
- When they press "Batal", then nothing is saved.
- When the file is not CSV, is empty, lacks a column, has more than 1,000
  rows or is larger than 1 MB, then nothing is saved and a message says
  what is wrong and what to do.
- When a role without the right sends a file, then the server refuses it.
  Confirmed by a check.

## Not included

- Excel files.
- Keeping the uploaded file. It is read, not stored.
- Changing or removing students through a file.
- Kelompok pengasuhan and everything tied to Asrama.

## Open questions

None.

## Steps

- [ ] 1. The rules that read a CSV file and decide, row by row, ready or
  skipped and why.
- [ ] 2. "Unggah berkas" shows next to "Formulir", with the column notes
  and "Unduh templat CSV".
- [ ] 3. Picking a file shows the preview: ready rows, skipped rows and
  reasons.
- [ ] 4. "Simpan … baris" saves the ready rows with their accounts and
  shows them in the list.
