# Tetapkan at the same moment as a student is placed or removed

Depends on: New intake assignment, Mentor group for a late student
Group: Pengasuh

## What we want

"Tetapkan" on Pengasuh > Penetapan angkatan baru gives every student of
the draft a group. Since "Mentor group for a late student", Pengaturan >
Pengguna baru mahasiswa can give one student a group or remove a
student too. When both happen for the same student at the same moment,
"Tetapkan" either fails with the app's general error page, or leaves a
removed student stored as a member of a group. "Tetapkan" must wait for
the other save and then answer as it already does when the same thing
happened a moment earlier.

What happened before this spec, read from the code and not seen on
screen, because it needs two saves within the same instant:

- Someone saves a student of the draft into a group on Pengguna baru
  mahasiswa while Kepala Unit presses "Tetapkan": "Tetapkan" has
  already read the student as having no group, waits for the save, and
  then fails on the rule that a student is in one group at most. Kepala
  Unit sees the general error page. Nothing is saved wrong.
- Someone removes a student of the draft on Pengguna baru mahasiswa
  while Kepala Unit presses "Tetapkan": the removal finds no group to
  take the student out of, and "Tetapkan" then stores the removed
  student as a member. The group page does not list or count a removed
  student, so nothing shows, but the stored members are wrong.

A moment earlier both are handled: "Tetapkan" refuses with a count when
a member got a group some other way, and a removed student is dropped
from the draft with a note.

Found by the review of "Mentor group for a late student".

## Who it is for

- Kepala Unit, who presses "Tetapkan".

## What should happen

- When "Tetapkan" and a save on Pengguna baru mahasiswa that gives one
  of the draft's students a group are sent at the same moment, then one
  waits for the other. If the student save was first, "Tetapkan" is
  refused with the message it already has for a member who got a group
  some other way, and nothing of it is saved. If "Tetapkan" was first,
  the student save is told the record changed, as today. Confirmed by a
  check that sends both at once.
- When "Tetapkan" and the removal of one of the draft's students are
  sent at the same moment, then one waits for the other, and the
  removed student is a stored member of no group afterwards. Confirmed
  by a check that sends both at once.
- When neither happens at the same moment, then "Tetapkan" works as
  today.

Already met on `main` before this spec: the third case, and in the
first case the half where "Tetapkan" was first. The student save then
already waited and was told the record changed. Both are kept and
confirmed again.

## Not included

- Any change to what "Tetapkan" checks or says a moment earlier or
  later.
- Any change to Pengguna baru mahasiswa.

## Better than the prototype

The prototype has one user at a time and no such case.

## Decided

1. "Tetapkan" holds the record of each student it is about to place,
   before it reads who still waits for a group, so a save or a removal
   of that student on Pengguna baru mahasiswa waits or is waited for.
   The hold is the weaker kind that does not stop lines pointing at
   the student from being written.
2. The messages are the ones the app already has. No new words on
   screen.
3. No table is added or changed.

Decided while building, because the issue did not say:

4. When the removal was first, "Tetapkan" waits and then goes through
   without the removed student, with the usual line in "Riwayat
   proses" for a student taken out of the draft. That is what it does
   for a student removed a moment earlier.
5. When "Tetapkan" was first, the removal waits, then takes the student
   out of the group they were just given, and logs that they left it.
   That is what a removal does for a student who has a group.
6. The students are held in one fixed order, so two saves that hold
   several students never wait for each other without end.
7. The checks send the real "Tetapkan" together with the real save and
   the real removal of Pengguna baru mahasiswa, not a stand-in for
   them, so they fail if either side stops waiting.

## Steps

- [ ] 1. "Tetapkan" and a student save at the same moment, with its
  check.
- [ ] 2. "Tetapkan" and a removal at the same moment, with its check.
