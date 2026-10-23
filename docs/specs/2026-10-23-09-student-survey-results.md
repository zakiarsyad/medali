# Student survey results

Depends on: Student survey period, Mentor evaluation, The survey form on Profil saya, Character assessment
Group: Pengasuh

## What we want

The tab "Evaluasi oleh mahasiswa" gets "Hasil evaluasi per kelompok".
For a period it shows, per group, how many members answered, the
group's average MEDALI achievement, the average survey answer, and the
result that combines both by the period's weights. When the period is
over, Kepala Unit fixes the results into the mentors' evaluation
history. No one ever sees one student's answers.

## Who it is for

- Fix the results: Kepala Unit.
- Read: Direktur / Wakil Direktur, Pegawai UPK, and Ketua Program Studi
  (their program's groups only).

## What should happen

- When one of these roles opens the tab, then "Hasil evaluasi per
  kelompok" shows the chosen period (the running one, else the latest)
  with its dates and weights, a choice of period with its status, and
  the numbers Responden, "Rerata capaian karakter", "Rerata umpan balik"
  (out of 5) and "Nilai evaluasi kurang".
- When no period exists, then they see "Buka periode evaluasi untuk
  mulai mengumpulkan umpan balik mahasiswa."
- When they look at the table, then each group shows code, program and
  angkatan, mentor, Responden ((n)/(members) and percent), Capaian
  karakter, Umpan balik (out of 5 and as 0–100), Nilai evaluasi and
  Predikat (Baik from 80, Cukup from 65, Kurang below), lowest first;
  25 per page. A group without answers shows "Belum ada responden". A group
  with 1 or 2 answers shows Responden only: no Umpan balik, Nilai
  evaluasi or Predikat, and the server sends none.
- When they search by group or mentor, or choose "Nilai kurang" or
  "Belum ada responden", then the list narrows; with no match "Tidak ada
  kelompok pada filter ini."
- When they press a group, then it opens "Rata-rata per pernyataan" for
  the eight statements, "Saran mahasiswa (tanpa nama)" and a link to the
  group page. With fewer than 3 answers the averages per statement and
  the suggestions are hidden, with the reason.
- When the period is Dibuka, then a line says the numbers are temporary.
- When the period is closed or over, then Capaian karakter stays as it
  was on the closing day. Confirmed by a check.
- When the period is Ditutup or Berakhir and not yet fixed, then Kepala
  Unit sees "Tetapkan hasil evaluasi"; after a confirmation that names
  the number of groups, each group with at least 3 answers gets a line in the
  evaluation history marked "Evaluasi oleh mahasiswa", with (n) of
  (members) who answered, and the tab says who fixed it and when.
- When results are fixed, then the button is gone and a second request
  is refused, so no group gets two lines. Confirmed by a check.
- When any role asks the server for one student's answers, or for
  suggestions of a group with fewer than 3 answers, then nothing is
  sent. Pengasuh and Mahasiswa cannot open the tab. Confirmed by a
  check.
- When any role but Kepala Unit sends "Tetapkan", then it is refused.
  Confirmed by a check.
- When the tab opens on a phone, then groups become cards with no
  sideways scroll; on the preview it shows within about 1 second.

## Not included

- The survey form for students (The survey form on Profil saya).
- Showing a mentor their own result.
- The limits 80 and 65, the scale of 1 to 5 and the 3 answers are the
  prototype's values, to be confirmed by the campus before launch.

## Better than the prototype

- The list is paged instead of cut off at 60.
- The server never sends single answers or hidden suggestions; the
  prototype only hides them on screen.
- Fixing twice cannot write the results twice.

## Decided

1. Below 3 answers a group shows no averages, and fixing writes no
   result for that group.
2. Both results stay in the one evaluation history, each marked with its
   source, and "Evaluasi terakhir" shows the newest.
3. A Kurang result from the survey allows replacing the mentor with the
   reason "Hasil evaluasi kurang", as in the prototype.
4. An answer counts for the mentor named when the answer was sent, also
   when the mentor was replaced before the period closed.

## Decisions made while building

5. Umpan balik is the mean of every score of the answers of a group for
   one mentor, out of 5. As 0 to 100 it is that mean divided by 5 times
   100, as "Komponen evaluasi pengasuhan" says, so answers of 1 only
   give 20. It is worked out from the scores, not from the rounded
   number out of 5.
6. Capaian karakter of a group is its Rerata MEDALI, as Kelompok
   pengasuhan shows it: the mean of the Rerata of its Aktif members who
   have an assessment. A group where nobody has one shows "-", and then
   has no Nilai evaluasi and no Predikat, since half of the result is
   missing.
7. Every number is kept to one decimal, a half going up, as the app
   writes numbers (74,2). Nilai evaluasi is worked out from Capaian
   karakter and Umpan balik as they are shown, and the Predikat from
   Nilai evaluasi as it is shown, so no number disagrees with those
   beside it. Responden shows its share as a whole percent.
8. The limit of 3 answers also hides "Umpan balik" out of 5, the
   averages per statement and the suggestions. It is one rule, kept
   with the shared survey rules, and the words on Profil saya read the
   same number.
9. The sample period has made-up answers of the Aktif members of every
   group that had started by its first day: most groups answer in full,
   in every third one member does not answer, and every fifth group
   sends none, so each case of the table can be tried. The group whose
   mentor was replaced a year earlier answers low, and its result is
   Kurang. Each answer names the mentor who held the group on the day
   it was sent, so the answers of the group whose mentor was replaced a
   month ago stay with the earlier mentor.
10. Reading "Hasil evaluasi per kelompok" is a new right, held by Kepala
    Unit, Direktur / Wakil Direktur, Ketua Program Studi and Pegawai
    UPK, the roles that open the tab. The list of rights names it
    "Melihat hasil evaluasi oleh mahasiswa per kelompok, tanpa jawaban
    per orang". Ketua Program Studi reads the groups of their program
    only; one without a program reads none.
11. The choice of period offers every period that was not cancelled,
    the latest first, each with its status. A cancelled period is not
    offered, as its answers are used nowhere.
12. The numbers of a period are taken on one day: today while it runs,
    and once it is over the day it closed, by hand or by its last day.
    The table holds the groups in force that had started by that day,
    so a group formed after the period is not counted as one that did
    not answer. A group's members are its Aktif members today, as the
    card of the period counts them.
13. A group whose answers were sent for two mentors, after a
    replacement during the period, has a row for each mentor, each
    with the group's members. A group without answers shows the mentor
    who held it on the day of the numbers.
14. Above the table, Responden adds the answers of every group out of
    their members, "Rerata capaian karakter" is the mean of the groups
    that have one, "Rerata umpan balik" the mean of the groups that
    show one, with the same as 0 to 100 beside it ("setara"), and
    "Nilai evaluasi kurang" counts the rows that are Kurang, "dari (n)
    kelompok". The search and the filter narrow the table only, as in
    the prototype.
15. Lowest Nilai evaluasi first; the rows without one come after, by
    group code. Where a row has no Predikat it says why: "Belum ada
    responden", "Responden kurang dari 3" or "Belum ada capaian
    karakter".
16. The server adds up the answers of every group the account may see,
    because the numbers above the table need them all, and sends only
    the page of 25 rows asked for.
17. The line under the heading writes the days as the card of the
    period does: "1 Jun 2026 sampai 21 Jun 2026".
18. A press on a row opens its detail right under it, and a press on
    the open row closes it. The address names the open row, so going
    back closes it too. The server reads the detail only of a row on
    the page shown, of a group the account may see.
19. Below 3 answers the averages per statement are hidden with the same
    reason as the suggestions: "Disembunyikan karena responden kurang
    dari 3 orang, untuk menjaga kerahasiaan." The server then does not
    even read them. A group without answers shows "Belum ada
    responden."
20. Each statement shows its average beside it, without the
    prototype's bars. The suggestions are listed in the order of their
    words, without a name or a date, so neither points to the student
    who wrote one. With none it says "Tidak ada saran tertulis."
21. The link reads "Buka kelompok (code)" and opens the group's page in
    Kelompok pengasuhan.
22. Capaian karakter of a period that is over is worked out as it stood
    at the end of its closing day on campus: each member's latest
    assessment saved by then, held at 70 for a Ringan or Sedang penalty
    of a violation on that day or before. Nothing has to be copied when
    the period closes, so this holds as well for a period that ends by
    its last day without anyone closing it. While the period runs it is
    the Capaian karakter of today.
23. The members it is taken over are the group's Aktif members of
    today, as in decision 12, so a student who joined or left the group
    since the closing day changes it. Once the results are fixed, the
    line in the evaluation history keeps the value of the day it was
    fixed.

## Steps

- [x] 1. The result rule (averages, weights, predikat, the 3-answer
  limit) with tests, and sample answers for the closed sample period.
- [x] 2. The table with the numbers, period choice, search, filters and
  paging.
- [x] 3. The detail per group, with hidden suggestions kept on the
  server.
- [x] 4. Capaian karakter is locked when a period closes.
- [ ] 5. "Tetapkan hasil evaluasi" writes into the evaluation history
  once.
- [ ] 6. Refusals and the phone layout.
