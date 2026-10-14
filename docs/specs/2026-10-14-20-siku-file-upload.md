# SIKU file upload

Depends on: SIKU adjustments
Group: Penilaian

## What we want

Penilaian SIKU gets a second way to enter gains and losses: "Unggah
berkas", next to "Formulir kolektif". Staff upload one CSV file with one
gain or loss per row, see which rows are ready and which are skipped, and
save the ready ones in one go. It works like Unggah berkas in Pengguna baru
mahasiswa.

## Who it is for

Kepala Unit and Penilai Mahasiswa.

## What should happen

- When they choose "Unggah berkas" in "Input nilai SIKU", then they see
  the columns (nim, jenis, alasan, poin, keterangan), the note "Jenis:
  tambah atau kurang. Alasan boleh nomor urut (penambahan 1–5, pengurangan
  1–4) atau teks alasannya. Poin 1–30.", "Unduh templat CSV" and a place
  to pick or drop a file.
- When they pick a file, then nothing is saved yet: they see how many rows
  are ready, the first six, and under "Lihat baris yang dilewati" each
  skipped row with its number and reason.
- When a row breaks a rule, then it is skipped with the prototype's
  message: "NIM tidak ada dalam data mahasiswa", "Mahasiswa tidak aktif",
  "Di luar mahasiswa yang dapat Anda kelola", "Jenis harus tambah atau
  kurang", "Alasan tidak dikenali", "Poin harus 1–30", or "Ketentuan
  keputusan Direktur wajib disertai keterangan atau nomor surat".
- When a student is in the file several times, then every row is kept,
  because one student may get several entries.
- When they press "Simpan (n) baris", then all ready rows are saved as one
  history entry "Unggah berkas (file name)" dated today, every SIKU
  updates, and the message says "(n) baris tersimpan." "Batal" saves
  nothing.
- When they open "Lihat mahasiswa" on that entry, then each student shows
  with their own points and reason. When they press "Batalkan" on it and
  confirm, then all its rows are cancelled together.
- When a student looks at "Transparansi nilai SIKU", then a row from a
  file shows "lewat unggah berkas" beside who entered it.
- When the file is not CSV, is empty, lacks a column, has more than 1,000
  rows or is larger than 1 MB, then nothing is saved and the message says
  what is wrong and what to do.
- When a file with the same name and rows was saved before, then a
  warning says so and they must confirm before saving again.
- When Pengasuh, Direktur or a student sends a file by hand, then the
  server refuses. Confirmed by a check.
- When "Simpan" is pressed twice, then the rows are saved once; the whole
  file is saved or none of it. Every row goes into the log that cannot be
  edited. Confirmed by a check.
- When used on a phone, then the preview scrolls inside its own box with
  no sideways page scroll.
- When a 1,000-row file is picked on the preview, then it is read and
  shown within about 2 seconds.

## Not included

- Excel files, and keeping the uploaded file itself.
- A file that sets a Nilai dasar per student: the prototype holds an
  unused part for it.

## Better than the prototype

- The whole file is saved in one go or not at all; the prototype saved in
  parts, so a failure could leave half a file.
- The file's limits match those of Pengguna baru mahasiswa.
- Saving the same file twice by mistake is caught.
- The server reads and checks the file again when saving.

## Decided

1. The file has no date column: every row gets the day of upload, as in
   the prototype. An entry for another date is made with the form.

## Steps

- [x] 1. The rules that read the SIKU file and decide, row by row, ready
  or skipped and why, with checks.
- [x] 2. "Unggah berkas" shows with the note and "Unduh templat CSV".
- [x] 3. Picking a file shows the preview and the skipped rows.
- [ ] 4. "Simpan (n) baris" saves the rows as one history entry, which
  can be opened and cancelled.

## Decisions made while building

- Each row of a file is kept as a gain or a loss of its own, for its one
  student, tied to the upload it came from. So a SIKU, a student's
  transparency list and the log count a file row like any form entry.
  The history shows the upload as one entry, and "Batalkan" cancels
  every row of it at once, each with a line in the log.
- The upload keeps its file name and a fingerprint of the file's
  content, never the file itself.
- The warning about a file saved before counts only an upload that is
  still in force: once cancelled, the same file may be saved again
  without a warning.
- The columns are read by their titles in the first row, or in the order
  of the template when the first row is a student. "keterangan" may be
  left out of a file; the other four must be there.
- "jenis" also takes "penambahan", "+", "pengurangan", "-" and "−", in
  any case, as the prototype does. "alasan" takes its number, the whole
  reason or its beginning, in any case. "poin" must be a whole number.
- For "Ketentuan lain sesuai keputusan Direktur/Wakil Direktur
  Kemahasiswaan" the keterangan becomes the "Dasar" of the row, at most
  200 characters; for every other reason it is the Keterangan, at most
  500 characters. A longer one skips the row with the form's message.
- A student who is not Aktif is skipped, as the form gives SIKU to Aktif
  students only.
- The preview shows nim, nama, jenis, alasan, poin and keterangan of the
  first six ready rows, and at most 30 skipped rows, as Pengguna baru
  mahasiswa does.
- In the history the upload shows "Unggah berkas" with its file name,
  "-" for points, and how many different students it holds that the
  reader may see. "Lihat mahasiswa" lists one line per row, 25 a page.
- The reading and the limits of a CSV file, and the place to pick or drop
  one, are shared with Pengguna baru mahasiswa, so both keep the same
  rules.
- A first row whose first cell is a number is read as a row of the
  file, not as titles.
- When the beginning of a reason fits more than one reason, the first in
  the prototype's order is taken. A number in "alasan" outside 1–5 for a
  gain or 1–4 for a loss is not recognized.
- A file with too many rows or with no row says "baris penyesuaian SIKU"
  in its message, where Pengguna baru mahasiswa says "baris mahasiswa".
- The note over the columns starts "Satu baris per penambahan atau
  pengurangan", not the prototype's "Satu baris per mahasiswa", since a
  student may have several rows.
- A removed student counts as a NIM that is not in the data, and is
  skipped with "NIM tidak ada dalam data mahasiswa."
- The preview shows jenis as "Penambahan" or "Pengurangan", and the
  points with their sign, as the history does.
