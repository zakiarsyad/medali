# Fitness test file upload

Depends on: Fitness test scores
Group: Penilaian

## What we want

"Input hasil tes kebugaran" gets a second way in: "Unggah berkas", next
to "Formulir kolektif". Staff upload one CSV file with one student and
one score per row, for many mentor groups at once, see which rows are
ready and which are skipped, and save the ready ones in one go.

## Who it is for

Kepala Unit and Penilai Mahasiswa.

## What should happen

- When they choose "Unggah berkas", then they see the columns (nim,
  skor), the note "Skor 0–100.", "Tanggal tes" (today at first), "Unduh
  templat CSV" and a place to pick or drop a file.
- When they pick a file, then nothing is saved yet: they see how many rows
  are ready, the first six with the category each score gives, and under
  "Lihat baris yang dilewati" each skipped row with its number and reason.
- When a row breaks a rule, then it is skipped with the prototype's
  message: "NIM tidak ada dalam data mahasiswa", "Mahasiswa tidak aktif"
  or "Skor harus angka 0–100". A score that is not a
  whole number is skipped with that same message, as the form refuses
  it.
- When a student is in the file twice, then the last row is used and the
  preview says how many: "(n) NIM ganda (dipakai baris terakhir)".
- When they press "Simpan (n) baris", then every ready row becomes that
  student's latest test with the chosen date, the message says "(n) baris
  tersimpan.", and the numbers, "Kategori" and the list update. "Batal"
  saves nothing.
- When the file is not CSV, is empty, lacks a column, has more than 1,000
  rows or is larger than 1 MB, or "Tanggal tes" is in the future, then
  nothing is saved and the message says what is wrong and what to do.
- When Pengasuh, Direktur or a student sends a file by hand, then it is
  refused. Confirmed by a check.
- When "Simpan" is pressed twice, then the rows are saved once; the whole
  file is saved or none of it. Every row goes into the log. Confirmed by
  a check.
- When used on a phone, then the preview scrolls inside its box with no
  sideways page scroll. A 1,000-row file is read and shown within about 2
  seconds on the preview.

## Not included

- Excel files, and keeping the uploaded file.
- Health notes in the file.

## Better than the prototype

- "Tanggal tes" can be chosen; the prototype always used the upload day.
- The whole file is saved in one go or not at all; the prototype saved in
  parts of 400.
- The file's limits match those of Pengguna baru mahasiswa.

## Decided

The issue had no open questions.

## Steps

- [x] 1. The rules that read the file and decide, row by row, ready or
  skipped and why, with checks.
- [ ] 2. "Unggah berkas" shows with the note, "Tanggal tes" and "Unduh
  templat CSV".
- [ ] 3. Picking a file shows the preview with categories.
- [ ] 4. "Simpan (n) baris" saves the rows as the latest tests.
