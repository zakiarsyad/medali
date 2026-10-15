# Mentoring meetings in the attendance score

Depends on: Attendance verification, Mentoring meetings and attendance, Extra activity schedule, Academic period
Group: Kegiatan

## What we want

Nilai kehadiran on Kegiatan karakter counts character activities only
until now. In the prototype it also counts the meetings a student has
with their Pengasuh. This spec adds those meetings, so the number a
student and the staff see on Kegiatan karakter is the same Kehadiran
that goes into Nilai karakter.

## Who it is for

- Mahasiswa: their own number.
- Kepala Unit, Pegawai UPK, Direktur / Wakil Direktur, Ketua Program
  Studi (own program) and Pengasuh (own mentees): the average. Read
  only.

## What should happen

- When a student opens Kegiatan karakter, then "Nilai kehadiran
  kegiatan" shows below it "(h)/(n) kegiatan karakter · (h)/(n)
  pertemuan pengasuhan", and the percentage is all attended out of all
  counted, with one decimal. 9 of 10 activities and 3 of 4 meetings give
  85.7.
- When a meeting's list is saved with the student as Hadir, then it
  counts as attended; Alpa counts as not attended; Izin and Sakit are
  left out and add to the number "Dispensasi". Confirmed by a check.
- When a meeting has no saved list yet, then it does not count for
  anyone. Confirmed by a check.
- When the running period changes, then only the meetings and the
  schedules of the new running period count, as "Academic period" names
  it; those of earlier periods no longer do. Confirmed by a check.
- When a student has no kelompok pengasuhan, then only their activities
  count and the line shows "0/0 pertemuan pengasuhan".
- When a student moved to another group during the semester, then the
  meetings where they were on the list count, each once. Confirmed by a
  check.
- When Pengasuh changes a saved list, then the student's number and the
  staff average follow on the next load.
- When a staff role opens "Kegiatan PPKS" or "Kegiatan tambahan", then
  "Rerata nilai kehadiran" is the average of these numbers over the
  students they may see, with "(n) mahasiswa, semua jenis kegiatan".
- When a student has nothing counted at all, then the number shows "-"
  with "belum ada kegiatan wajib" and they are left out of the average.
- When a student asks for another student's number by hand, or Pengasuh
  for a student outside their mentees, then the server refuses.
  Confirmed by a check.
- When the page is opened on a phone, then the line under the number
  wraps with no sideways scroll.
- When Kegiatan karakter opens with sample data on the preview, then it
  still shows within about 1 second for both the student and the staff.

No case was met on `main` before this spec: the number counted
activities only. All of it is built here.

## Not included

- Filling in the meetings (spec "Mentoring meetings and attendance").
- Asrama activities: they have their own attendance and do not count
  here.
- The Kehadiran column and the final grade (spec "Character grade
  list").
- A clarification for a meeting marked Alpa: the student asks the
  Pengasuh, who can change the list.
- The four meetings and their equal weight with an activity are the
  prototype's values, to be confirmed by the campus before launch.

## Better than the prototype

- One rule works out the number for Kegiatan karakter and for Nilai
  karakter, on the server, so the two can never differ.
- The average is worked out by the database, not by reading every
  student's attendance on each page load.

## Decided

1. The number keeps the name "Nilai kehadiran kegiatan", since the line
   below says what is counted.
2. Only the meetings of the running period count, read from "Academic
   period", the same period the schedules keep.
3. A student missing from a saved meeting list, such as one who joined
   the group after the list was saved, is not counted for that meeting.
4. A mentor meeting counts in Kehadiran with the same weight as an
   activity, as in the prototype.

## Decisions made while building

The issue did not say, so these were decided:

5. A saved meeting counts at once, on the day it is saved. It has no
   upload time to wait for, unlike an activity.
6. A student who is not Aktif counts no meetings, as they take part in
   no activity either: their own number shows "-", and they stay out of
   the average, as before.
7. A meeting counts by the student's own mark on its saved list, also
   when the meeting is of a group they have left or a group that has
   ended since.
8. "Dispensasi" counts the dispensations of activities and the Izin and
   Sakit of meetings together, under its line "izin atau sakit, tidak
   dihitung".
9. The number keeps the form the app already shows, such as "85,7%".
10. Pengasuh's average is over their mentees of today, and counts each
    mentee's meetings in every group they were in this period.

## Steps

- [x] 1. The rule for Nilai kehadiran takes in saved meetings, with
  checks for Hadir, Alpa, Izin, Sakit, no list and a change of group.
- [ ] 2. The student's number shows activities and meetings.
- [ ] 3. "Rerata nilai kehadiran" on both staff tabs uses the same rule.
