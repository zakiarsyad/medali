# Closing a semester

Depends on: Academic period, Character grade scheme, Character grade list,
Mentoring meetings in the attendance score, Mentoring scores, Score limit
under a discipline penalty
Group: Pengaturan

## What we want

Nilai karakter is worked out live, so once the next academic period
starts, the grade of the semester that just ended is gone. Kepala Unit
gets "Tutup semester" on Pengaturan > Periode akademik: it keeps a fixed
copy of every active student's Nilai karakter for that period, with the
weights used, which later changes no longer touch.

## Who it is for

- Close a semester: Kepala Unit (the right to set periods).
- Nobody else has this page. Reading the fixed grades is added by
  "Grades of a closed semester".

## What should happen

- When Kepala Unit opens Periode akademik, then each period in the list
  shows "Berjalan", "Selesai, belum ditutup" or "Ditutup (date)". A
  period whose end date has passed and that is not closed has the button
  "Tutup semester". A period that has not ended has none.
- When they press "Tutup semester", then they see, before anything is
  kept: the period's name, "(n) mahasiswa aktif", "(n) nilai lengkap",
  "(n) belum lengkap", the weights and letter limits that will be kept,
  and the tick "Saya paham nilai semester ini tidak dapat diubah lagi."
- When they press "Tutup semester ini" without the tick, then nothing is
  kept and the message says "Centang konfirmasi terlebih dahulu."
- When they tick and confirm, then for every student who was active in
  that period the app keeps Kehadiran, Pengasuhan, SIKU, SKPM, the
  weights, Nilai akhir, Huruf, whether it passes, and the mark "dibatasi
  70" where it applied; the list shows "Ditutup (date) · (n) nilai
  ditetapkan"; and the message says "Semester (period) ditutup."
- When a grade is fixed, then Kehadiran and Pengasuhan are those of the
  closed period, and SIKU and SKPM are as they stand at the moment of
  closing. A student with a missing part is kept as "Belum lengkap" with
  the parts they have. Confirmed by a check.
- When a part, a weight or a letter limit changes after the closing,
  then the fixed copy does not change. Confirmed by a check.
- When an earlier period is still "Selesai, belum ditutup", then a later
  one cannot be closed, and the message names the earlier period.
- When the closing is pressed twice, or by two people at once, then the
  period is closed once and the second sees "Semester ini sudah
  ditutup." The whole closing is kept or nothing is. Confirmed by a
  check.
- When a semester is closed, then a line goes to the change log: who,
  when, the period and the counts. Confirmed by a check.
- When any role but Kepala Unit sends a hand-made closing, or anyone
  sends a change to a fixed grade, then the server refuses it. No
  request can change a fixed grade. Confirmed by a check.
- When the list and the closing step are opened on a phone, then they
  are one column with no sideways scroll.
- When the closing runs on the preview with sample data, then it ends
  within a few seconds and the page stays usable.

## Not included

- Reading the fixed grades (Grades of a closed semester).
- Opening a closed semester again.
- Stopping changes to the closed period's attendance lists, mentoring
  scores or activities: they stay as they are, and no longer change the
  fixed grade.
- Starting SIKU or SKPM points again for the new semester: they run on.
- A weight scheme per semester: there is still one current scheme; the
  copy only remembers the weights used.
- Fixing capaian karakter (MEDALI): each assessment already carries its
  period.
- A printed report or a file to download.

## Better than the prototype

- The prototype has one fixed period and no closing, so a past grade
  cannot be read at all.

## Decided

1. A closed semester cannot be opened again. The step shows the counts
   first and asks for a tick, so a mistake is caught before closing.
2. SIKU and SKPM go into the fixed grade as they stand at the moment of
   closing, so the semester should be closed soon after it ends.
3. Only a period whose end date has passed can be closed; until then
   there is no button.
4. "Belum lengkap" need not be zero before closing: the count is shown
   as a warning and those students are kept as "Belum lengkap".
5. A period that has not started yet shows "Belum dimulai" and has no
   button. A period whose end date has passed shows "Selesai, belum
   ditutup", also while the rest of the app still takes it as the
   running period because the next one has not started.
6. "Every student who was active in that period" is every Aktif student
   at the moment of closing, the same students the live grade list
   holds: the app keeps no record of who was Aktif on an earlier day.
7. Kehadiran counts the activities and mentor meetings of the closed
   period as they stand on the day of closing, by the rule of
   "Mentoring meetings in the attendance score"; Pengasuhan is the score
   the Pengasuh gave for the closed period.
8. "Dibatasi 70" is kept for every student under a Ringan or Sedang
   penalty at the moment of closing, as the live list marks them, also
   one kept as "Belum lengkap"; where the limit lowered Nilai akhir, the
   score before the limit is kept too.
9. The Keterangan of SIKU ("SIKU dasar 65" or the gains and losses) and
   whether SIKU was adjusted are kept as they were shown at closing, and
   Kehadiran keeps how many activities were attended of how many, so
   "Grades of a closed semester" can show the list as it looked.
10. The weights, the lower limit of each letter and the pass letter are
    kept with the closing, so "Grades of a closed semester" can show the
    Skema bobot of that period.
11. The line in the change log is the closing itself: who closed it,
    when, the period, and how many students, complete grades and
    "Belum lengkap" grades it kept. The database refuses to change,
    delete or empty it, as it does for the settings of Skema bobot.
12. When several earlier periods are still "Selesai, belum ditutup", the
    message names the oldest of them, the one to close first: "Semester
    (period) belum ditutup. Tutup semester itu terlebih dahulu."
13. The date in "Ditutup (date)" is the day of closing on campus.
14. The step opens under its period in the list, through the page
    address, with "Batal" to leave it; "Tutup semester ini" sends it.
15. A closing that finds no Aktif student still closes the period, with
    0 nilai ditetapkan.
16. The right to close a semester is its own named right in the
    permission list, given to Kepala Unit only.
17. The sample data already holds three periods that have ended and are
    not closed, so the button can be tried on the preview; only the
    oldest can be closed first. No closed period is added to the sample
    data.

## Steps

- [x] 1. The table for fixed grades is added, and periods get the state
  Berjalan, Selesai belum ditutup or Ditutup.
- [x] 2. The right to close a semester is added to the permission list,
  with its checks.
- [ ] 3. The period list shows the state and "Tutup semester".
- [ ] 4. The step that shows the counts, the weights and the tick.
- [ ] 5. The closing keeps every grade at once, in order of periods, and
  writes the log line.
- [ ] 6. Later changes leave the copy as it is, and double closing is
  refused, with checks.
- [ ] 7. The phone layout and the time check.
