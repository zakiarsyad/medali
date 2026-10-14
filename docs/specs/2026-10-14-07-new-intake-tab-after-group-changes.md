# Penetapan angkatan baru after a student is placed or moved

Depends on: New intake assignment, Mentor group for a late student

## What we want

Since "Mentor group for a late student", Pengaturan > Pengguna baru
mahasiswa can put a student into a fixed group, move them to another
group, or take them out. Pengasuh > Penetapan angkatan baru does not
follow: for an angkatan that is fixed it still shows the groups as they
were on the day they were fixed, and "Batalkan penetapan" followed by
"Tetapkan" puts every student back where they were on that day. The tab
must show a fixed angkatan as its groups are today, and a cancel must
keep the members as they are today.

What happened before this spec, after a penetapan was fixed. Each was
confirmed by a check that failed before the change:

- A late student put into one of its groups on Pengguna baru mahasiswa
  showed in no group on the tab, and was not in the member count there.
- A student moved from one group to another still counted in the first
  group on the tab.
- After "Batalkan penetapan", the draft held a moved student in the
  first group again, and a late student in no group.

The group pages, the student detail, the Mahasiswa list and what a
mentor sees already read the groups as they are today and are right.

## Who it is for

- Kepala Unit and Pegawai UPK, who prepare and fix a penetapan.
- Direktur / Wakil Direktur and Ketua Program Studi, who read it.

## What should happen

- When one of these roles opens an angkatan that is fixed, then each
  group shows the number of members, putra and putri it has today, and
  the list of angkatan shows the number of students in its groups
  today. Ketua Program Studi still sees only the groups of their
  program.
- When Kepala Unit or Pegawai UPK opens "Anggota" of a group of a fixed
  angkatan, then it lists the members the group has today, also a late
  student put in on Pengguna baru mahasiswa, and not a student who was
  moved out or removed.
- When Kepala Unit presses "Batalkan penetapan" and confirms, then the
  draft that stays holds each group with the members it had at that
  moment. A late student and a moved student stay in the group they
  were in. Confirmed by a check.
- When Kepala Unit then presses "Tetapkan" again without changing
  anything, then every student is in the same group as before the
  cancel. Confirmed by a check.
- When a penetapan is still a draft or submitted, then nothing changes:
  it shows and saves what was prepared, as today.
- When a role that may not read the member names opens the tab, then it
  still sees counts only, as today. Confirmed by a check.

No case about a fixed angkatan or a cancel was met on `main` before
this spec. A draft and a submitted penetapan already behaved as the
fifth case says, and stay untouched.

## Not included

- A penetapan that is not fixed yet and names a student who was put
  into a group some other way: fixing it is refused with a count, and
  "Bentuk ulang" is the way out, as today.
- Any change to Pengguna baru mahasiswa.
- A line in "Riwayat proses" for each placement made on Pengguna baru
  mahasiswa. Those are kept in their own log.
- The mentor a fixed angkatan shows after the mentor of a group was
  replaced. The tab still shows the mentor chosen at the penetapan.

## Better than the prototype

The prototype keeps one list of members per group, so it has no such
difference. This brings the app back to that.

## Decided

1. For a fixed angkatan the tab reads the members of the groups in
   force. For a draft, a submitted or a cancelled one it reads what was
   prepared, as today.
2. A cancel writes the members of each group in force into the draft
   before it ends the groups, so the draft and the ended groups say the
   same.
3. Students on Cuti and Non aktif are counted and listed by the rules
   the tab already has.
4. No table is added or changed.

Decided while building, because the issue did not say:

5. A fixed angkatan had no "Anggota" on the tab. It gets one, as in the
   prototype, for Kepala Unit and Pegawai UPK only: the roles that
   already read member names on this tab. It lists the members to read
   only. Moving a student of a fixed group stays on Pengguna baru
   mahasiswa.
6. By the rules the tab already has, a member on Cuti or Non aktif is
   not counted and not listed for a fixed angkatan either. At a cancel
   such a member is taken out of the draft, with the usual line in
   "Riwayat proses", so "Tetapkan" again gives them no group. Every
   Aktif student gets the same group as before.
7. A group that lost all its members before the cancel stays in the
   draft without members. The tab already refuses to fix such a draft
   and names "Bentuk ulang" as the way out.
8. A member of a cancelled group who is still named by the draft of
   another angkatan, after their angkatan was changed, is kept in the
   group they were really in. The old place in the other draft is
   given up, as forming groups already does.

## Steps

- [x] 1. A fixed angkatan shows its groups, counts and members as they
  are today, with its checks.
- [ ] 2. "Batalkan penetapan" keeps the members as they are at that
  moment, with its checks.
