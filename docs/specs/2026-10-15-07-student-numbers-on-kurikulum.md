# Student numbers and scores on Kurikulum

Depends on: Student list and detail, Character assessment, Academic period, Mentor groups
Group: Kurikulum

## What we want

The parts of Kurikulum left out by the earlier Kurikulum specs because
no student numbers existed yet: how many active students are in each
tahap, the default Target peserta of a PPKS activity, and the average
MEDALI score of the chosen tahap with a score beside each nilai.

## Who it is for

Kepala Unit, Pegawai UPK, Direktur / Wakil Direktur, Ketua Program Studi
and Pengasuh. The count of active students per tahap is the same for all
five; the scores cover only the students each may see.

## What should happen

- When any of the five roles opens Kurikulum, then each tahap box shows
  "(number) mahasiswa aktif": the active students whose current semester
  falls in that tahap.
- When a PPKS activity has no Target peserta, then its row shows the
  number of active students in its semester instead of "-", marked
  "otomatis".
- When Kepala Unit or Pegawai UPK opens "Tambah kegiatan PPKS", then
  Target peserta starts with that number, and they can change it.
- When the chosen tahap has assessed students (a student's latest
  assessment counts), then "Penjabaran MEDALI tahap (name)" shows
  "Rerata tahap (score)", and each nilai box shows its average score
  coloured by the Skala predikat MEDALI.
- When the chosen tahap has no assessed student yet, then no score
  shows, and the boxes look as before.
- When Ketua Program Studi opens the page, then Rerata tahap and the
  scores count only students of their program; Pengasuh, only their own
  anak asuh. The counts of active students per tahap are for everyone.
  Confirmed on this computer and by a check.
- When a semester has no active student yet (for example before new
  students are put in), then the target uses the semester before it.
  Confirmed by a check.
- When a hand-made request asks for the scores of students outside the
  viewer's program or anak asuh, then the server leaves them out.
  Confirmed by a check.
- When the page is opened on a phone, then the tahap boxes stack and the
  scores stay readable with no sideways scroll.
- When the page opens with sample data, then it shows within about 1
  second; counts and averages are worked out by the database, not by
  loading every student.

## Not included

- The "Dijadwalkan" column (spec "Scheduled count on Kurikulum").
- Any change to how a score is calculated; it is read from Asesmen
  karakter.

## Better than the prototype

- A target filled in by the app is marked "otomatis", so staff can tell
  it from one they typed.

## Decided

1. The count per tahap is not limited to the viewer's students: it is a
   plain count with no names, and the same for everyone, as in the
   prototype.
2. When a semester has no active student, the target uses the semester
   before it, as in the prototype. It covers new cohorts not yet put in.
3. Each student's semester is read from "Academic period"; this spec has
   no rule of its own for it.

## Decisions made while building

The issue did not say, so these were decided:

4. A tahap box counts the active students of every program whose
   semester, worked out from their angkatan and the running academic
   period, falls in that tahap. Students on Cuti, Non aktif or removed
   do not count. While no period runs yet, no student has a semester:
   every tahap shows "0 mahasiswa aktif".
5. The number sits under the description of the tahap, as in the
   prototype, written with a dot for thousands, such as "1.250
   mahasiswa aktif".

## Steps

- [x] 1. The count of active students per tahap shows in the tahap
  boxes.
- [ ] 2. Target peserta of a PPKS activity defaults to the semester's
  count.
- [ ] 3. Rerata tahap and the score per nilai show in Penjabaran MEDALI,
  limited to the viewer's students.
