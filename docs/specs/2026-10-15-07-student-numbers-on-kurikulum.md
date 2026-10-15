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
6. A PPKS activity of semester S with no Target peserta shows the active
   students in semester S. When S has none, it shows those in the
   semester just before; semester 1 with none shows 0. Only one semester
   back is looked at, as in the prototype. While no period runs, it
   shows 0. The word "otomatis" sits small beside the number; on a
   phone it stays inside the activity's block. Every Target peserta,
   typed or filled in by the app, is written with a dot for
   thousands.
7. "Tambah kegiatan PPKS" starts Target peserta with that same number.
   When that number is 0, the field starts empty instead, so a saved
   activity is not held at 0 once students are counted. Whatever is
   saved is a typed target. Emptying the field saves no
   target, so the row shows the number filled in by the app again.
   "Ubah" on an activity with no target keeps the field empty, so
   saving it keeps it filled in by the app.
8. The list of special and additional activities follows no semester,
   so it has no number filled in by the app: a row with no target
   still shows "-", and its form starts empty.
9. The scores of the chosen tahap count only the active students the
   viewer may see whose semester falls in that tahap and who have any
   assessment; each student's latest one counts. A nilai shows the
   average of their latest score for that nilai, to one decimal. Rerata
   tahap is the average of their Rerata, worked out as Rerata capaian
   on Asesmen karakter is, to one decimal. With no assessed student, or
   while no period runs, nothing shows and the boxes look as before.
10. A nilai's score has the dot of the predikat its average falls in,
    in the colours of the Skala predikat MEDALI, instead of the
    prototype's shaded background. "Rerata tahap (score)" sits at the
    right of the panel's heading, as in the prototype.
11. A person with several roles sees the scores of the students of
    only the roles that open Kurikulum. A role that does not open the
    page adds no students.
12. On a phone the tahap boxes, the nilai boxes and the heading of the
    panel each stack, and the scores stay beside the name of their
    nilai, so nothing scrolls sideways.

## Steps

- [x] 1. The count of active students per tahap shows in the tahap
  boxes.
- [x] 2. Target peserta of a PPKS activity defaults to the semester's
  count.
- [x] 3. Rerata tahap and the score per nilai show in Penjabaran MEDALI,
  limited to the viewer's students.
