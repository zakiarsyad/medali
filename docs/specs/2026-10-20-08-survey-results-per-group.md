# Student survey results per group

Depends on: Student survey period, The survey form on Profil saya,
Character assessment
Group: Pengasuh

## What we want

The tab "Evaluasi oleh mahasiswa" gets "Hasil evaluasi per kelompok".
For a chosen period it shows, per group, how many members answered, the
group's average MEDALI achievement, the average survey answer, and the
result that combines both by the period's weights. No one ever sees one
student's answers.

## Who it is for

- Read: Kepala Unit, Direktur / Wakil Direktur, Pegawai UPK, and Ketua
  Program Studi (their program's groups only).

## What should happen

- When one of these roles opens the tab, then "Hasil evaluasi per
  kelompok" shows the chosen period (the running one, else the latest)
  with its dates and weights, a choice of period with its status, and
  the numbers Responden, "Rerata capaian karakter", "Rerata umpan balik"
  (out of 5) and "Nilai evaluasi kurang".
- When no period exists, then they see "Buka periode evaluasi untuk
  mulai mengumpulkan umpan balik mahasiswa."
- When they look at the table, then each row shows code, program and
  angkatan, mentor, Responden ((n)/(members) and percent), Capaian
  karakter, Umpan balik (out of 5 and as 0–100), Nilai evaluasi and
  Predikat (Baik from 80, Cukup from 65, Kurang below), lowest first;
  25 per page. A group without answers shows "Belum ada responden". A
  group with 1 or 2 answers shows Responden only: no Umpan balik, Nilai
  evaluasi or Predikat, and the server sends none.
- When they search by group or mentor, or choose "Nilai kurang" or
  "Belum ada responden", then the list narrows; with no match "Tidak ada
  kelompok pada filter ini."
- When they press a group, then it opens "Rata-rata per pernyataan" for
  the eight statements, "Saran mahasiswa (tanpa nama)" and a link to the
  group page. With fewer than 3 answers the averages per statement and
  the suggestions are hidden, with the reason.
- When the period is Dibuka, then a line says the numbers are
  temporary.
- When the period is Ditutup or Berakhir, then Capaian karakter is the
  one of its closing day: a later assessment does not change it.
  Confirmed by a check.
- When an answer was sent before the group's mentor changed, then it
  counts on the row of the mentor it was sent for; a group with two
  mentors in one period shows one row per mentor. Confirmed by a check.
- When a cancelled period exists, then it cannot be chosen, and its
  answers count nowhere.
- When any role asks the server for one student's answers, or for the
  suggestions of a group with fewer than 3 answers, then nothing is
  sent. Pengasuh and Mahasiswa cannot open the tab. Confirmed by a
  check.
- When the tab opens on a phone, then groups become cards with no
  sideways scroll; on the preview it shows within about 1 second.

## Not included

- "Tetapkan hasil evaluasi": fixing the results into the mentors'
  evaluation history, and what that changes in "Evaluasi terakhir" and
  in replacement. That is the next spec.
- Showing a mentor their own result.
- The limits 80 and 65, the scale of 1 to 5 and the 3 answers are the
  prototype's values, to be confirmed by the campus.

## Better than the prototype

- The list is paged instead of cut off at 60.
- The server never sends single answers or hidden suggestions; the
  prototype only hides them on screen.

## Decided

1. Issue "Student survey results" is split: this spec shows the
   results; "Tetapkan hasil evaluasi" follows in its own spec.
2. A group whose mentor changed during the period shows one row per
   group and mentor, because each answer belongs to the mentor it was
   sent for.
3. Capaian karakter of the closing day is worked out from the latest
   assessment of each Aktif member entered on or before that day;
   nothing extra is stored. The next spec fixes it for good when the
   results are fixed.
4. Members in "(n)/(members)" are the Aktif members of the group under
   that mentor today; for a mentor who no longer holds the group, the
   number who answered for them.

## Steps

- [ ] 1. The result rule (averages, weights, predikat, the 3-answer
  limit, one row per group and mentor) with tests, and sample answers
  for the closed sample period.
- [ ] 2. Capaian karakter as of the closing day.
- [ ] 3. The table with the numbers, period choice, search, filters and
  paging.
- [ ] 4. The detail per group, with hidden suggestions kept on the
  server.
- [ ] 5. Refusals and the phone layout.
