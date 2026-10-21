# Students needing coaching

Depends on: Character assessment; Mandatory counselling; Academic period
Group: Penilaian

## What we want

Asesmen karakter gets the panel "Teridentifikasi perlu pembinaan". It
lists the students whose latest assessment is low, with how serious it is
and their weakest value. Penilai Mahasiswa can call such a student for
counselling ("Panggil konseling") straight from the list, and sees how
the call stands. This spec owns the rule for who needs coaching;
Character coaching list reads it.

## Who it is for

- Call for counselling, and read the call's status, date and Jam:
  Penilai Mahasiswa (right "Panggil konseling dari asesmen").
- Read the list, without anything about a call: Kepala Unit, Direktur /
  Wakil Direktur, Ketua Program Studi (own program), Pengasuh (own
  mentees).

## What should happen

- When anyone looks at the panel, then a student is listed when their
  latest assessment has Rerata below 65 or any one score below 58. The
  level is Intensif when Rerata is below 60, Sedang when below 65,
  otherwise Ringan. Scores 55, 58, 60, 57, 59, 61 (58.3) give Intensif;
  62, 60, 64, 58, 61, 63 (61.3) give Sedang; 70, 72, 56, 75, 74, 73
  (70.0) give Ringan; 66, 70, 58, 72, 68, 71 is not listed. A student
  with no assessment is never listed. Confirmed by a check.
- When they look at a row, then it shows the student, Tingkat, Rerata
  MEDALI and "Aspek terlemah" with its score (the first one when two are
  equal). Penilai Mahasiswa also sees the column Konseling.
- When the list is long, then it is sorted Intensif, Sedang, Ringan, then
  lowest Rerata first, 10 rows with "Tampilkan semua (n)", then 25 a
  page. With nobody: "Tidak ada mahasiswa yang teridentifikasi perlu
  pembinaan."
- When Penilai Mahasiswa presses "Panggil konseling" and confirms, then a
  counselling call of the kind "Pemanggilan" is made for that student
  with the reason "Asesmen karakter: rerata (n), pembinaan (level), aspek
  terlemah (value)", Konselor sees it in Konseling, and the row shows its
  status instead of the button, with the date and Jam once Konselor set
  them. Nothing else from Konseling shows here.
- When any role but Penilai Mahasiswa looks at the panel, then there is
  no column Konseling and nothing says whether a student was called.
  When such a role asks by hand for a call's status, then it is refused.
  Confirmed by a check.
- When a student already has a call in the running academic period,
  whatever its status, then no second call can be made in that period,
  also after a new assessment. A new period allows a new call if the
  student is still listed. A voluntary request does not block a call.
  Confirmed by a check.
- When Kepala Unit, Pengasuh or a student sends a call by hand, or a call
  is sent for a student who is not listed, then it is refused. Confirmed
  by a check.
- When "Panggil konseling" is pressed twice, or by two people at once,
  then one call is made and the second gets "Sudah ditugaskan." Each call
  goes into the log. Confirmed by a check.
- When used on a phone, then rows become cards with no sideways scroll.
  The panel shows within about 1 second.

## Not included

- The kind "Pemanggilan" itself and what Konselor does with the call:
  both are in Mandatory counselling.
- The Pembinaan karakter page, where the follow-up of these students is
  tracked (Character coaching list).
- The reason of the call shown to the student.
- The call's status for any role but Penilai Mahasiswa and Konselor.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- "Panggil konseling" asks for confirmation, since the student is told.
- The full list is paged.
- One call per student per academic period is kept by the server.
- Only the sender and Konselor see how a call stands; the prototype
  showed the status to every role with the tab.

## Decided

1. The numbers 65, 58 and 60 are kept, fixed in the code.
2. Only Penilai Mahasiswa may call, not Kepala Unit.
3. After a call is finished, the student is not called again in the same
   academic period; in a new period they may be, if they are still
   listed.

## Steps

- [x] 1. The rule that lists a student and gives the level and weakest
  value, with checks.
- [ ] 2. The panel shows the list, sorted, with "Tampilkan semua".
- [ ] 3. The right "Panggil konseling dari asesmen" is added for Penilai
  Mahasiswa, with the reading of status, date and Jam of these calls,
  and its checks.
- [ ] 4. "Panggil konseling" makes the call, one per student per
  academic period, and the row shows its status to Penilai Mahasiswa.
