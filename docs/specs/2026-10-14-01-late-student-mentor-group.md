# Mentor group for a late student

Depends on: Mentor groups, New intake assignment

## What we want

A student who is added after their angkatan's groups were fixed has no
group and no mentor. Pengaturan > Pengguna baru mahasiswa gets a
"Kelompok pengasuhan" choice, so the person who adds or changes the
student can put them into an existing group of the same angkatan,
program studi and jalur. The page also shows who still has no group.

## Who it is for

- Kepala Unit, Pegawai UPK and Pengelola Asrama, who already add and
  change students on this page.

## What should happen

- When one of them opens the form to add or change a student, then
  "Kelompok pengasuhan" offers "Belum ditetapkan" and every fixed group
  of the chosen angkatan, program studi and jalur, each with its code,
  mentor and member count, and a line that explains the choice.
- When no group exists for that angkatan, program and jalur, then the
  choice holds only "Belum ditetapkan" and the line says groups are
  formed in Pengasuh > Penetapan angkatan baru.
- When they change angkatan, program studi or jalur in the form, then
  the choice is rebuilt, and a group that no longer fits is cleared,
  also when it was the student's saved group.
- When they change a student who already has a group, then the choice
  shows that group, and they may pick another group that fits or
  "Belum ditetapkan", as in the prototype. On saving, the student
  leaves the old group's member list and count and joins the new one,
  the old mentor no longer sees the student, and who moved the student
  and when is kept. Confirmed by a check.
- When they save with a group chosen, then the student shows in that
  group's member list, the student detail shows the mentor and group,
  and the mentor can see the student.
- When they look at the list on the page, then the column "Kelompok
  pengasuhan" shows the code or "Belum ditetapkan", and the number
  "Belum punya kelompok pengasuhan" counts the active students in this
  list who have none, as in the prototype.
- When a chosen group already has 35 members, then a warning shows and
  saving is still allowed.
- When a student is removed on this page, then they leave their group's
  member list and its count.
- When a hand-made request names a group of another angkatan, program
  or jalur, or a group that is still a draft, then the server refuses
  it. Roles without the right to add students are refused as before.
  Confirmed by a check.
- When two people change the same student at once, then the second is
  told the record changed. Confirmed by a check.
- When the form opens on a phone, then the choice fits one column.

No case was met on `main` before this spec: the form had no group
choice, and the list had no group column and no such number. All of it
is built here.

## Not included

- A group column in Unggah berkas: students from a file get their group
  through Penetapan angkatan baru or this form.
- Forming a new group here.

## Better than the prototype

- A group that no longer fits after a change is cleared, not kept.
- The server checks that the group matches the student.
- A full group gives a warning.

## Decided

1. A student who already has a group may be moved to another one here,
   as in the prototype: the choice stays open, limited to the groups of
   the student's angkatan, program studi and jalur, and every move
   keeps who and when.
2. Pengelola Asrama can choose a group, the same as the rest of the
   form, as in the prototype.

Decided while building, because the issue did not say:

3. Every placement made on this page is kept in a log that cannot be
   changed: joining a group, moving to another, going back to none,
   and leaving on removal, each with who and when.
4. The member count in the choice is the group's Aktif members, the
   same number the group's page shows.
5. The warning shows when the chosen group holds 35 or more Aktif
   members and is not the group the student is already in.
6. A removed student is taken out of their group for good. The log
   keeps which group they left.
7. To catch two people changing one student, each student record keeps
   a count of its changes. A save that started from an older count is
   refused, and the message asks to load the page again.
8. The column shows the mentor's name under the group code, as in the
   prototype. The line under the number says "atur di Pengasuh >
   Penetapan", as in the prototype.
9. A student on Cuti or Non aktif may be given a group too, as in the
   prototype. The rules of the group's page then decide whether they
   are listed and counted.
10. No new right is added: the right to add students covers choosing a
    group.

## Steps

- [x] 1. The "Kelompok pengasuhan" choice in the form, with the server
  check that the group fits.
- [ ] 2. The column in the list and the number "Belum punya kelompok
  pengasuhan".
- [ ] 3. Moving a student to another group or to none, and removal
  taking the student out of the group, with their checks.
- [ ] 4. The full-group warning, the two-person case and the phone
  layout.
