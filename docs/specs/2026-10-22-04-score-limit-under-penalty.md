# Score limit under a discipline penalty

Depends on: Recording a discipline penalty, Character assessment,
Character assessment file upload, Character grade list, Scores in the
student detail, Scores on the mentor group and mentor pages
Group: Penilaian

## What we want

A student under a Ringan or Sedang discipline penalty has their
character scores held at 70. The six MEDALI scores and the final nilai
karakter never show above 70, a score above 70 cannot be entered for
them, and every screen says why. The penalty is read from Pembinaan;
nothing is typed again in Penilaian.

## Who it is for

- Kepala Unit and Penilai Mahasiswa, who enter scores.
- Every role that reads the scores, each within its own rows.
- Pembina Disiplin Mahasiswa, who sees the effect before saving.

## What should happen

- When a student has a Ringan or Sedang penalty, whatever its status or
  date, then each MEDALI score above 70 counts as 70 and a final nilai
  karakter above 70 counts as 70. Scores 80, 78, 84, 72, 82, 86 give
  Rerata 70.0 instead of 80.3; a final score of 82.4 becomes 70.0. A
  Berat penalty does not limit. Confirmed by a check.
- When Kepala Unit or Penilai Mahasiswa picks such a student in Asesmen
  karakter, then a note says "Mahasiswa ini menjalani hukuman disiplin
  (kategori) jenjang (n). Skor dibatasi paling tinggi 70." and no score
  above 70 can be entered. A higher score sent by hand is refused.
  Confirmed by a check.
- When they upload a file, then the format note says the limit, and a
  row with a score above 70 for such a student is skipped with "Skor di
  atas 70 untuk mahasiswa dalam hukuman disiplin".
- When a score above 70 was saved before the penalty, then it stays
  stored as entered and shows as 70 on every screen.
- When anyone looks at Penilaian karakter, then the number "Dibatasi
  70" counts the limited students, their rows carry the badge "Dibatasi
  70", and the letter is taken from the limited score.
- When they open such a student there, then the line says "Dibatasi 70
  dari (score) karena hukuman disiplin."
- When an allowed role opens the student detail, then the score panels
  show the limited numbers and "Nilai semester ini dibatasi paling
  tinggi 70 karena hukuman disiplin (kategori) jenjang (n). Rerata
  sebelum pembatasan (x).", where (x) is the average of the scores as
  stored. The single scores before the limit are not shown.
- When an allowed role looks at a limited student's scores on the mentor
  group and mentor pages, then they show the limited numbers.
- When Pembina Disiplin Mahasiswa picks Ringan or Sedang in "Catat
  hukuman disiplin", then "Konsekuensi" shows "Dibatasi paling tinggi
  70. Rerata (x) menjadi (y)" with the medal before and after.
- When a role that may not read discipline records sees a limited
  score, then it sees the limit but not the Uraian. Confirmed by a
  check.
- When used on a phone, then the notes wrap with no sideways scroll,
  and the list still shows within about 1 second.

## Not included

- The limit notes on Profil saya (My character achievement, My
  character grade and SIKU record).
- Any limit on fitness, SIKU, SKPM or attendance scores.
- Recording or changing the penalty (Recording a discipline penalty).
- Ending the limit: no penalty is cancelled or removed in the app, so
  the limit stays, as in the prototype.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- One rule on the server gives the limited score to every screen.
- A score saved before the penalty is kept as entered and limited only
  when shown.

## Decided

1. Every Ringan or Sedang penalty the student has limits the scores,
   whatever its status or date, as in the prototype.
2. The letter is taken after the limit, as in the prototype.
3. The limit is put on each MEDALI score, as in the prototype, so the
   Rerata and the predikat follow from the limited scores.
4. The entry form and the file refuse scores above 70 for a limited
   student; a score saved before the penalty is kept as entered and
   limited when shown.
5. The limit is put on every screen that shows a MEDALI score, not only
   the ones named here: Hasil asesmen karakter, Riwayat asesmen, the
   Mahasiswa list, the Dashboard, Perlu pembinaan and Profil saya show
   the limited scores too, and count and filter by them, so no score of
   a limited student shows above 70 anywhere.
6. The assessment before the latest one, the dashed line of the medal,
   is limited too.
7. The note in Asesmen karakter and the line in the student detail name
   the highest Ringan or Sedang penalty the student has, as in the
   prototype.
8. The sliders of a limited student start at their latest scores held
   at 70, or at 70 for a student never assessed.
9. A score above 70 sent by hand is refused with a message that asks to
   load the page again and lower the score. A score in a file is checked
   once it is rounded to a whole number, so 70.4 counts as 70.
10. The format note of "Unggah berkas" says: "Skor 40–100; paling tinggi
    70 untuk mahasiswa yang menjalani hukuman disiplin ringan atau
    sedang."
11. "Dibatasi 70" counts, and marks, every limited student, also one
    whose grade is "Belum lengkap" or 70 or less. The line "Dibatasi 70
    dari (score) karena hukuman disiplin." shows only when the limit
    lowered Nilai akhir, since otherwise there is no higher score to
    name. It sits in "Nilai karakter (KEP-220)", wherever the detail
    opens.
12. The limit note in "Capaian karakter" shows for every limited student
    who was assessed, as in the prototype, also when no score was above
    70.
13. "Konsekuensi" names the predikat after the cap in brackets, as in the
    prototype, and shows the medal held at 70 with the scores as stored
    as a dashed line. For a student never assessed it only says
    "Dibatasi paling tinggi 70."
14. Roles that may not read discipline records, such as Penilai
    Mahasiswa, see the Kategori and Jenjang in the note and the line, as
    their wording asks, and never the Uraian.
15. "Konsekuensi" shows the latest Rerata and medal only for a student
    the account may record a penalty for.

## Steps

- [x] 1. The rule that says whether a student is limited and gives the
  limited scores, with checks.
- [x] 2. The note and the refusal of a score above 70 in Asesmen
  karakter and in "Unggah berkas".
- [x] 3. "Dibatasi 70" on Penilaian karakter: the number, the badge and
  the line.
- [x] 4. The limit line in the student detail, and the limited numbers
  on the mentor group and mentor pages.
- [x] 5. The before and after picture in "Konsekuensi".
