# Character assessment

Depends on: Mentor groups, Academic period
Group: Penilaian

## What we want

Penilaian gets the tab "Asesmen karakter". Staff enter a student's score
for each of the six MEDALI values. The average gives the predikat from
the Skala predikat MEDALI in Kurikulum. A student's latest assessment is
their capaian karakter everywhere else in the app.

## Who it is for

- Enter: Kepala Unit and Penilai Mahasiswa (right "Asesmen karakter").
- Read: Direktur / Wakil Direktur, Ketua Program Studi (own program),
  Pengasuh (own mentees).

## What should happen

- When a staff role opens the tab, then they see four numbers (Sudah
  diasesmen, Rerata capaian, Diasesmen semester ini, Belum diasesmen) and
  "Hasil asesmen karakter".
- When Kepala Unit or Penilai Mahasiswa picks a student under "Input
  capaian MEDALI", then six sliders show (Mandiri, Empati, Disiplin,
  Adaptif, Loyal, Integritas), whole numbers 40–100, starting at the
  student's latest scores, or at 75 when there are none. Beside each is
  the level its score falls in, with the text of that value's main
  indicator from Kurikulum: below 65 level 1, 65–74 level 2, 75–84 level
  3, 85 and above level 4.
- When they move a slider, then "Pratinjau medali" shows the new shape
  over the last one as a dashed line, "Rerata baru" and the predikat.
- When anyone looks at an assessment, then Rerata is the plain average of
  the six scores to one decimal, and the predikat is Emas from 85, Perak
  from 75, Perunggu from 65, otherwise Perlu pembinaan. Scores 80, 78,
  84, 72, 82, 86 give 80.3 and Perak; six scores of 85 give Emas; 64.9
  gives Perlu pembinaan. Confirmed by a check.
- When they choose "Sumber asesmen" (Observasi pengasuh, Penilaian diri,
  Penilaian teman sejawat, Rapat dewan pengasuh, Instrumen asesmen
  MEDALI), may fill "Catatan penilai" and press "Simpan asesmen", then
  the message says "Asesmen (name) disimpan." and the list updates.
- When a student is assessed again, then the new one counts and the
  earlier ones stay as history, shown when the row is opened. Each
  assessment records the academic period it was made in.
- When the numbers are worked out, then "Sudah diasesmen" counts
  students with any assessment, "Diasesmen semester ini" those whose
  latest one was made in the running period, and "Belum diasesmen" those
  with none. A new semester does not empty the list. Confirmed by a
  check.
- When they look at the list, then each student shows Tanggal, Sumber
  and who entered it, the six scores, Rerata and Predikat, with search,
  the filter "Belum diasesmen", 25 a page, newest first. "Catatan
  penilai" shows in an opened row to Kepala Unit and Penilai Mahasiswa
  only, and is not sent to the reading roles. A student with none shows
  "Belum diasesmen".
- When a read-only role opens the tab, then it says "Hasil asesmen MEDALI
  diinput oleh Penilai Mahasiswa atau Kepala Unit Pembangunan Karakter."
- When Pengasuh, Direktur or a student sends an assessment by hand, a
  score is outside 40–100, or Ketua Program Studi asks for a student of
  another program, then it is refused. Confirmed by a check.
- When "Simpan asesmen" is pressed twice, then one assessment is saved.
  Each save goes into the log that cannot be edited. Confirmed by a check.
- When used on a phone, then the sliders and the medal stack in one
  column and the list becomes cards. The tab shows within about 1 second.

## Not included

- "Unggah berkas" (Character assessment file upload) and
  "Teridentifikasi perlu pembinaan" (Students needing coaching).
- The limit of 70 for students under a discipline punishment (Score
  limit under a discipline penalty).
- The student's own view (My character achievement).
- Opening the student detail from a name in the list (Scores in the
  student detail).
- Cancelling an assessment: the prototype has none; a wrong one is
  replaced by a new one.
- Starting again each semester, and closing a semester.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- "Penilai" is the signed-in account, not a name typed by hand.
- The filters "Diinput penilai" and "Data contoh" are dropped; the third
  number becomes "Diasesmen semester ini".
- Earlier assessments of a student can be seen.
- A new student's sliders start at 75, not at a made-up number.

## Decided

1. There is no one assessment per student per semester, and a new
   semester does not start as "Belum diasesmen": the latest assessment
   counts until a newer one is saved, and each one records its academic
   period.
2. A wrong assessment cannot be cancelled; a new assessment replaces it.
3. The level text beside a slider is the Kurikulum main indicator of that
   value and level, so there is one source.
4. "Catatan penilai" is read only by those who may enter: Kepala Unit and
   Penilai Mahasiswa.
5. The running period is read from "Academic period".

## Steps

- [x] 1. Assessments are stored with source, note and who; the right
  "Asesmen karakter" is added, with checks; sample assessments.
- [x] 2. The rule for Rerata and predikat, with checks.
- [ ] 3. The tab shows the numbers and "Hasil asesmen karakter".
- [ ] 4. The form with sliders and "Pratinjau medali" saves one student.
- [ ] 5. A row opens the student's earlier assessments.

## Decisions made while building

- The tab is read by the roles that hold it, as Data SKPM: Kepala Unit
  and Penilai Mahasiswa see every student, Direktur / Wakil Direktur
  every student, Ketua Program Studi their own program, Pengasuh their
  own mentees. No other role holds it, and a student does not.
- An assessment keeps the six whole scores, its source, "Catatan
  penilai", the academic period that ran when it was saved, who saved it
  and when.
- An assessment is never changed or deleted, which the database itself
  refuses. So the assessments are their own log that cannot be edited:
  each save is one line with who, when and the scores, and what came
  before it is the student's earlier assessment. No second log is kept.
- "Catatan penilai" holds 500 characters at most, as the Keterangan of
  SIKU; a longer one is refused.
- The sample data gives some students two or three assessments, some
  only one from an earlier period, some only one from the last few days,
  among them D3 Pajak students for the sample Ketua Program Studi and
  mentees of the sample Pengasuh, and leaves most Aktif students without
  one.
- The predikat is given by the Rerata as shown, to one decimal. The
  prototype gives it by the unrounded average; with six whole scores the
  two never fall on different sides of 65, 75 or 85, so the answer is
  the same.
- "Rerata capaian" is the average of the students' latest Rerata, each
  as shown, to one decimal; with nobody assessed it shows "-".
