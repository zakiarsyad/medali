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
- [x] 2. "Unggah berkas" shows with the note, "Tanggal tes" and "Unduh
  templat CSV".
- [x] 3. Picking a file shows the preview with categories.
- [x] 4. "Simpan (n) baris" saves the rows as the latest tests.

## Decisions made while building

- The switch between "Formulir kolektif" and "Unggah berkas" sits at
  the top of "Input hasil tes kebugaran", under its line, and starts on
  "Formulir kolektif". The panel stays beside "Kategori": the preview
  has only four columns, and on a phone it scrolls inside its box.
- The column "skor" may also be titled "nilai" or "skor_kebugaran", as
  in the prototype. The template is "templat-tes-kebugaran.csv", with
  one made-up student and the score 82.
- A file may name any Aktif student, in any mentor group or in none;
  unlike the group form, it is not tied to one group.
- A score with a decimal is skipped, even 80.0, since the form refuses
  it too. A score with a leading zero, such as 07, is skipped for the
  same reason.
- The preview shows nim, nama, skor and Kategori of the first six ready
  rows, and at most 30 skipped rows, as the other uploads do. When a NIM
  is in the file twice, the row shown is the one used. The category
  follows the "Ambang skor" in force when the file is read.
- A removed student counts as a NIM that is not in the data, as in the
  other uploads, and so does a student the account may not enter scores
  for: the row is skipped with "NIM tidak ada dalam data mahasiswa."
  Today Kepala Unit and Penilai Mahasiswa may enter scores for every
  student, so the second never shows.
- The NIM ganda count only rows that would have been ready: a row of the
  same NIM that is skipped is listed with its reason instead.
- "Tanggal tes" is picked once for the whole file. A day after today
  shows "Tanggal tes tidak boleh setelah hari ini. Pilih hari ini atau
  tanggal sebelumnya." under the field at once; picking a file still
  shows its preview, and the server refuses the save with the same
  message and keeps nothing. The picked file and its preview stay, so
  "Tanggal tes" can be changed and "Simpan (n) baris" pressed again
  without picking the file anew. The group form keeps its shorter
  message.
- A file is kept as one save of scores, like one group form: it keeps
  the file's name and a fingerprint of its content, never the file
  itself, and each row is its own line in the log that cannot be changed
  or deleted. The save made last counts, so a file saved after a group
  form wins for the students it names, and the other way round.
- "Simpan" pressed twice for the same picked file is answered as the
  first press. The same key sent with another file, another "Tanggal
  tes", or by another account is refused and saves nothing.
- At "Simpan" the server reads the file again: a row whose student
  stopped being Aktif since the preview is skipped then, and the message
  counts only the rows saved.
- The same file may be saved again later without a warning: its rows
  simply become the latest tests again, as a second group form would.
