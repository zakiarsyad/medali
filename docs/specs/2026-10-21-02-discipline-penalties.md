# Recording a discipline penalty

Depends on: Violation notes, Mentor groups, Academic period
Group: Pembinaan

## What we want

On "Pelanggaran disiplin", staff record a discipline violation and the
penalty set for it: a Kategori (Ringan, Sedang, Berat), each with three
Jenjang. Before saving they see what the penalty means for the student.
Everyone allowed sees the list of penalties and the rules table.

## Who it is for

- Record: Pembina Disiplin Mahasiswa and Kepala Unit.
- Read only: Direktur / Wakil Direktur, Ketua Program Studi (their
  program only) and Pengasuh (their own mentees only).

## What should happen

- When Pembina Disiplin Mahasiswa opens the tab, then they see the
  numbers "Pelanggaran ringan", "Pelanggaran sedang", "Pelanggaran
  berat" and "Kerja sosial belum selesai" (penalties whose kerja sosial
  ends today or later), the form "Catat pelanggaran", the panel
  "Konsekuensi", "Daftar pelanggaran" and the table "Ketentuan hukuman
  disiplin" (penalty, kerja sosial length, effect on nilai karakter and
  legal basis for all nine Jenjang).
- When they pick a student, then "Konsekuensi" shows "Belum ada riwayat
  pelanggaran", or how many penalties the student has and the highest
  one. A warning shows when the chosen Jenjang is lower than that one;
  saving is still allowed.
- When they choose a Kategori and Jenjang, then "Konsekuensi" shows the
  penalty; the kerja sosial dates; for Ringan and Sedang that nilai
  karakter is limited to 70; for Berat jenjang pertama the two semesters
  of suspension and the semester to repeat; for the other two Berat that
  the student's status ends for good.
- When the Jenjang carries kerja sosial, then the form also asks Bentuk
  kerja sosial (one or more; "lainnya" needs a text), Lokasi kerja
  sosial and Mulai kerja sosial, and shows "Selesai pada ...". The
  location at the instansi asal is offered only for a student who has
  an Instansi asal.
- When they fill Tanggal pelanggaran, Uraian pelanggaran and the
  optional Nomor keputusan and press "Simpan pelanggaran", then it shows
  in the list as "Dijatuhkan" with a message, and the numbers update.
- When the penalty ends the student's status for good, then saving
  needs the tick "Saya memahami hukuman ini memberhentikan mahasiswa
  secara permanen dan memerlukan Keputusan Direktur", and it is saved as
  "Ditetapkan".
- When no student is picked, Uraian is under 5 letters, no Bentuk kerja
  sosial is chosen, "lainnya" has no text, the tick is missing, Tanggal
  pelanggaran is in the future or falls in no academic period, or Mulai
  kerja sosial is before Tanggal pelanggaran, then nothing is saved and
  the message says why.
- When they use "Cari nama atau NIM" or the filters by Kategori and
  status, then the list narrows; an empty result shows "Belum ada
  pelanggaran pada filter ini."
- When they press "Rincian" on a row, then they see Uraian, the kerja
  sosial form, place and dates, Nomor keputusan, who recorded it, the
  legal basis and the effect on nilai karakter or the suspension.
- When they press "Hukuman ringan" on a "Pelanggaran lanjutan" row in
  Catatan pelanggaran, then this form opens with that student picked.
- When they pick a student in "Catat pelanggaran" on Catatan
  pelanggaran, then the student's box there also says how many
  discipline penalties that student has.
- When a reading role opens the tab, then they see the numbers, list,
  "Rincian" and rules table, no form, and a line saying who records.
  Pengasuh sees "Menampilkan mahasiswa binaan Anda." and only those.
  Pengasuh still cannot open Catatan pelanggaran.
- When Mahasiswa, Konselor, Penilai Mahasiswa, Pegawai UPK, Pengelola
  Asrama or a BAM role types the address, a reading role sends a
  hand-made save, or Pengasuh or Ketua Program Studi asks for a student
  outside their rows, then the server refuses it. Confirmed by a check.
- When "Simpan pelanggaran" is pressed twice, then one penalty is saved.
  Each save adds a line to the log that cannot be changed. Confirmed by
  a check.
- When the tab is opened on a phone, then the form is one column, the
  list is cards and the rules table scrolls inside its own box.
- When the tab is opened on the preview, then it shows within about 1
  second, and the list is paged, 25 at a time.

## Not included

- Changing the status of a penalty, and the conditions to continue
  study (Discipline penalty follow-up).
- "Tugaskan konseling wajib" in "Rincian" (Mandatory counselling from a
  discipline penalty).
- Applying the limit of 70 on the Penilaian screens, and the before and
  after score picture in "Konsekuensi" (Score limit under a discipline
  penalty).
- The "Catat hukuman disiplin" button on the Asrama page (Discipline
  proposal after SP 2).
- The nine Jenjang, their penalties, kerja sosial lengths and legal
  basis are the prototype's values, to be confirmed by the campus before
  launch.

## Better than the prototype

- "Dicatat oleh" is the signed-in person, not a name typed by hand.
- A future violation date is refused.
- The picked student and kerja sosial choices are cleared after saving,
  so the next penalty does not reuse them by mistake.
- The list is paged.

## Decisions

1. Kerja sosial may not start before the Tanggal pelanggaran.
2. A Jenjang lower than an earlier penalty gives a warning only, as in
   the prototype; saving is not blocked.
3. A Tanggal pelanggaran in no academic period is refused, as on
   Catatan pelanggaran, because the semester to repeat comes from it.

## Steps

- [x] 1. The table for discipline penalties is added, with the fixed
  rules for the nine Jenjang and sample penalties.
- [x] 2. The right to record a penalty is added to the permission list,
  with its checks.
- [x] 3. The numbers, the list with search and filters, and the rules
  table, read only and limited to each role's rows.
- [x] 4. "Rincian" for one penalty.
- [x] 5. The form "Catat pelanggaran" with the kerja sosial part.
- [x] 6. The panel "Konsekuensi" with the history and the warning.
- [ ] 7. The link "Hukuman ringan" from Catatan pelanggaran, and the
  number of penalties in the student's box there.
