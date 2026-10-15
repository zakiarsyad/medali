# Character assessment file upload

Depends on: Character assessment
Group: Penilaian

## What we want

"Input capaian MEDALI" gets a second way in: "Unggah berkas", next to
"Satu mahasiswa". Staff upload one CSV file with one student per row and
the six scores, see which rows are ready and which are skipped, and save
the ready ones in one go. It works like Unggah berkas in Pengguna baru
mahasiswa.

## Who it is for

Kepala Unit and Penilai Mahasiswa.

## What should happen

- When they choose "Unggah berkas", then they see the columns (nim,
  mandiri, empati, disiplin, adaptif, loyal, integritas), the note "Skor
  40–100.", "Sumber asesmen" to pick once for the whole file, "Unduh
  templat CSV" and a place to pick or drop a file.
- When they pick a file, then nothing is saved yet: they see how many rows
  are ready, the first six with each row's Rerata and predikat, and under
  "Lihat baris yang dilewati" each skipped row with its number and reason.
- When a row breaks a rule, then it is skipped with the prototype's
  message: "NIM tidak ada dalam data mahasiswa", "Mahasiswa tidak aktif"
  or "Skor harus angka 40–100". A score with a decimal is rounded to a
  whole number: 79.5 becomes 80.
- When a student is in the file twice, then the last row is used and the
  preview says how many: "(n) NIM ganda (dipakai baris terakhir)".
- When they press "Simpan (n) baris", then every ready row becomes that
  student's newest assessment, with the file name beside the source, the
  message says "(n) baris tersimpan.", and the numbers and list update.
  "Batal" saves nothing.
- When the file is not CSV, is empty, lacks a column, has more than 1,000
  rows or is larger than 1 MB, then nothing is saved and the message says
  what is wrong and what to do.
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
- A note per student; "Catatan penilai" is only in the form.
- Taking a whole upload back: the prototype has none; a wrong row is
  replaced by a new assessment.

## Better than the prototype

- "Sumber asesmen" is asked for; the prototype left it empty for uploads.
- The preview shows Rerata and predikat for each row.
- The whole file is saved in one go or not at all; the prototype saved in
  parts of 400.

## Decided

1. A whole upload cannot be taken back in one go, as in the prototype;
   new assessments replace the wrong ones.

## Steps

- [ ] 1. The rules that read the file and decide, row by row, ready or
  skipped and why, with checks.
- [ ] 2. "Unggah berkas" shows with the note, "Sumber asesmen" and "Unduh
  templat CSV".
- [ ] 3. Picking a file shows the preview.
- [ ] 4. "Simpan (n) baris" saves the rows as the newest assessments.

## Decisions made while building
