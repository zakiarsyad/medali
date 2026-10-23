# My character achievement

Depends on: My profile, Character assessment, Score limit under a
discipline penalty, Academic period, Past semesters in the student detail
Group: Profil saya

## What we want

A student sees the result of their own asesmen karakter on Profil saya:
their latest MEDALI scores as the medal picture, which value stands out
and which needs care, and how the scores moved over the semesters. It is
the same card and chart staff see in the student detail, for the
student's own record only.

## Who it is for

- Mahasiswa: their own results only.

## What should happen

- When an Aktif student with a result opens Profil saya, then the card
  "Capaian karakter semester (n)" shows "Rerata (x)", the predikat, the
  source and date of the assessment, the medal with one score per MEDALI
  value, and "Paling menonjol pada (value) (score). Perlu perhatian pada
  (value) (score)." Scores 80, 78, 84, 72, 82, 86 show Rerata 80.3,
  Perak, Integritas and Adaptif.
- When they also have an earlier result, then the medal shows it as a
  dashed line and the card says "Garis putus-putus menunjukkan semester
  lalu."
- When they were never assessed, then the card shows "Belum diasesmen"
  and "Belum ada hasil asesmen karakter semester ini.", with no "Input
  asesmen" button.
- When their scores are held at 70 by a Ringan or Sedang penalty, then
  the card shows the held scores, the note "Nilai semester ini dibatasi
  paling tinggi 70 karena hukuman disiplin (kategori) jenjang (n).
  Rerata sebelum pembatasan (x).", and "Sebelum pembatasan, paling
  menonjol pada … Perlu perhatian pada …" named from the scores as
  stored.
- When they look at "Riwayat per semester", then a line chart shows
  Rerata and each MEDALI value for every assessed semester, with a
  legend, and the same numbers in a small table under it. With no
  assessed semester it says "Belum ada riwayat."
- When a result is added or corrected by Penilai Mahasiswa, then the
  student sees the new numbers the next time the page is opened.
- When a result has a "Catatan penilai", then it is not shown or sent to
  the student's browser. Confirmed by a check.
- When a student tries by a hand-made request to see another student's
  results, then they only ever get their own. Confirmed by a check.
- When the student is Cuti or Non Aktif, then the card is titled
  "Capaian karakter" with no semester and shows the latest result they
  had, and the chart shows their history.
- When the page is opened on a phone, then the medal and the chart shrink
  to the screen width with no sideways scroll, and the page shows within
  about 1 second.

## Not included

- Nilai karakter (KEP-220) and SIKU (My character grade and SIKU record).
- Entering or changing results: that is Penilaian > Asesmen karakter.
- Comparing with other students or with the class average.
- Any change to the staff card in the student detail.

## Decided

1. No class or angkatan average beside the student's own, as in the
   prototype.
2. Under a penalty, the strongest and the weakest value are named from
   the scores as stored, as in the prototype, because the limit makes
   them equal. The student sees their own stored scores there; staff
   screens stay as they are.
3. The card shows the latest assessment, the same one the staff card and
   every other character screen use. "Belum diasesmen" shows when there
   is none.
4. The page reads the signed-in student's own record only; nothing in the
   request says which student, so there is no other student to ask for.
5. A new right in the list of what each role may do, "Melihat capaian
   karakter sendiri", given to Mahasiswa.
6. The two cards sit under the profile panel and its source line.

## Steps

- [ ] 1. The right to read one's own assessment results is added to the
  permission list, with its checks.
- [ ] 2. The card "Capaian karakter semester (n)" on Profil saya, with
  the medal, the sentence, the limit note and the empty state.
- [ ] 3. "Riwayat per semester" on Profil saya, with the chart, its table
  and the empty state.
- [ ] 4. Phone layout and speed of both cards.
