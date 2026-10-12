# Mentor groups

## What we want

The Pengasuh menu gets its first tab, "Kelompok pengasuhan", and a page
for each group. A kelompok pengasuhan is 25 to 35 students of one
angkatan, program studi and jalur, formed when they enter and looked
after by one mentor until they graduate. This spec adds the groups, the
mentor of each group and its history, and the sample groups. A mentor is
a staff account that has the Pengasuh role.

## Who it is for

- Kepala Unit, Direktur / Wakil Direktur and Pegawai UPK: every group.
- Ketua Program Studi: only the groups of their study program.
- Pengasuh: does not open this menu; from now on they see only the
  students of the groups they hold.

## What should happen

- When one of the four roles opens Pengasuh, then they see the intro,
  the five tabs (Kelompok pengasuhan, Pengasuh, Evaluasi oleh mahasiswa,
  Evaluasi dan penggantian, Penetapan angkatan baru; the last four empty
  for now), and the numbers "Kelompok pengasuhan" (with active students)
  and "Ukuran kelompok" (average, and how many groups hold 25–35).
- When they look at the list, then each row shows the group code (for
  example "KP 24-D3PJK-01"), program studi, angkatan, "alih program"
  when it applies, the mentor with "sejak (date)", the number of
  members, and "Pengasuh awal" or "(n) kali diganti". 25 rows per page.
- When they search by code or mentor name, or choose Semua prodi or
  Semua angkatan, then the list narrows. With no match they see "Tidak
  ada kelompok pada filter ini."
- When they press a group, then its page shows "Semua kelompok
  pengasuhan", the code, a line with program studi, angkatan, start
  date, member count and number of academic classes, the panel "Pengasuh
  saat ini" (name, gelar, unit, mengasuh sejak), "Riwayat pengasuh
  kelompok" (each mentor, from and to, reason), and "Anggota kelompok"
  (name, NIM, kelas akademik, semester).
- When a member is on Cuti, then they are listed with a "Cuti" tag and
  are not counted in the member count. A Non aktif student is not
  listed.
- When a group has fewer than 25 members, then its page explains why.
- When Kepala Unit, Direktur / Wakil Direktur or Ketua Program Studi
  presses a member, then the student detail opens. For Pegawai UPK a
  member is not a link, and a hand-made request for the detail is
  refused. Confirmed by a check.
- When any role with the Mahasiswa menu opens a student, then the detail
  shows "Pengasuh" (linked to the group page for roles that may open
  Pengasuh) and "Kelompok pengasuhan (code), diasuh sejak (date).
  Sebelumnya: (names)", or "Belum ditetapkan". The Mahasiswa list gets
  the Pengasuh column.
- When Ketua Program Studi opens a group of another program by its
  address, then it is refused.
- When Pengasuh or Mahasiswa type the Pengasuh address, or a hand-made
  request asks for groups, then it is refused. Confirmed by a check.
- When the app asks which students a mentor may see, then the answer is
  the members of the groups they hold today. Confirmed by a check.
- When data is saved, then a student is in one group at most, a group
  has one current mentor, and a group cannot be erased while it has
  members. Enforced by the database and confirmed by a check.
- When the sample data command runs, then there are several sample
  mentors with groups, two without one, at least two groups of 25 to 35
  made-up students, smaller groups for the other sample students, and
  one group with an earlier mentor.
- When Kepala Unit removes an account, or takes the Pengasuh role from
  it, in Pengaturan > Pengguna dan peran while it holds a group, then
  it is refused and the message says to replace the mentor first.
  Confirmed by a check.
- When the page opens on a phone, then rows become cards with no
  sideways scroll.
- When the preview opens the list, then it shows within about 1 second.

No case was met on `main` before this spec: all of it is built here.

## Not included

- The other four tabs (their own specs).
- Rerata MEDALI, the MEDALI chart and the MEDALI columns of the member
  list, and "Perlu pembinaan" ("Scores on the mentor group and mentor
  pages").
- "Catatan pengasuhan 90 hari" (it comes with "Mentoring notes").
- The evaluation column, panel, button and the number "Evaluasi kurang"
  ("Mentor evaluation"); "Ganti pengasuh" and the number "Penggantian
  tahun ini" ("Mentor replacement").
- Choosing a group in Pengguna baru mahasiswa ("Mentor group for a late
  student").
- The group size of 25 to 35 are the prototype's values, to be confirmed
  by the campus before launch.

## Better than the prototype

- Opening a group outside one's rows says it is not allowed, instead of
  jumping back to the list without a word.
- Database rules keep one group per student and one mentor per group.

## Decided

1. A student on Cuti is a member of their group: listed with a "Cuti"
   tag but not counted in the size. A Non aktif student leaves the list
   but stays in the group's stored history.
2. The program code abbreviations (ASP, D3AK, D3PJK…) come from the
   prototype and are stored with each study program.
3. Pengguna dan peran refuses to remove a Pengasuh account, or to take
   the Pengasuh role from it, while it holds a group, and says to
   replace the mentor first.
4. Staff accounts already hold a gelar and a unit. Nothing is added to
   the account.

Decided while building, because the issue did not say:

5. A group code is "KP (two digits of the angkatan)-(program code)-(the
   group's number, two digits)". A group of the alih program jalur has
   "-AJ" before the number, as in the prototype.
6. The panel "Pengasuh saat ini" shows name, gelar, unit and "mengasuh
   sejak", as the issue lists. The NIP the prototype also shows there is
   left out: it is personal data the issue does not ask for.
7. Ketua Program Studi sees the numbers of their own groups only, and a
   Ketua Program Studi with no study program sees no group.
8. The start date of a sample group is 1 September of its angkatan
   year, as in the prototype.
9. One mentor may hold more than one group, as in the prototype.
10. The numbers above the list count every group the account may see,
    whatever the list is filtered by. "Mahasiswa aktif" there is the
    Aktif members of those groups.
11. The list shows the newest angkatan first, then by program studi and
    group number. The search by mentor name looks at the mentor of today,
    not at earlier mentors.
12. "Semua prodi" and "Semua angkatan" offer only the program studi and
    the angkatan that have a group the account may see.
13. The other four tabs show the title and the tabs over an empty area,
    as every page that is not built yet does.
14. Dates are written short, such as "1 Sep 2025", as on the other
    screens, not long as in the prototype.
15. A member's detail opens in a box over the group's page, the same box
    as on Mahasiswa, and closing it returns to the group.
16. A Ketua Program Studi who opens a group of another program gets the
    app's usual "Akses ditolak" page.
17. Members are listed by name and the mentor history newest first. The
    number of academic classes counts the kelas of Aktif members only.
18. A group left without a mentor shows "-" in the list, and its page
    says it has no mentor yet.
19. In the student detail the mentor's name is the link to the group's
    page, and the group code under it is plain words. The prototype
    links the name to the mentor's own page, which is not built yet.
    "Diasuh sejak" is the day the mentor of today took the group.
20. A student whose group is left without a mentor shows "Belum
    ditetapkan" with the group code under it, and the earlier mentors
    when there are any.
21. The Pengasuh column on Mahasiswa shows the mentor's name without
    the gelar and not as a link, and "-" for a student without a mentor,
    as in the prototype.

## Steps

- [x] 1. Groups, their members and their mentor history are stored, with
  the database rules and the sample groups.
- [x] 2. The mentor row rule (own mentees) reads from the groups, with
  tests.
- [x] 3. The Kelompok pengasuhan tab with its numbers, filters and
  paging.
- [x] 4. The group page with mentor, history and members.
- [x] 5. The Pengasuh line in the student detail and the column on
  Mahasiswa.
- [x] 6. Refusals for other roles and other programs, and the phone
  layout.
- [ ] 7. Pengguna dan peran refuses to remove a mentor who holds a
  group, with its check.
