# Group members and a mentor's students a page at a time

Depends on: Mentor groups; Mentor list
Group: Pengasuh

## What we want

The list "Anggota kelompok" on the page of one mentor group and the
list "Mahasiswa binaan" on the page of one mentor are loaded a page at
a time, like the other long lists of the app. The building rules say
"Long lists are loaded a page at a time", and the Pengasuh audit checks
that the group page does so.

Today both pages read every student at once. The sample mentor Hendra
Wijaya holds 9 groups, so his page reads 47 students in one go, and it
grows with every group a mentor is given.

## Who it is for

- Kepala Unit, Pegawai UPK, Direktur / Wakil Direktur, and Ketua
  Program Studi (their program's groups and students only): everyone who
  opens a group page or a mentor page.

## What should happen

- When a group has more than 25 members, then "Anggota kelompok" shows
  25 per page, in the same order as today, with the page links the other
  Pengasuh lists use.
- When a mentor has more than 25 students, then "Mahasiswa binaan"
  shows 25 per page, in the same order as today, with the same page
  links.
- When a list has 25 or fewer, then it shows as today, with no page
  links.
- When a page past the end is asked for by address, then the last page
  is shown.
- When Ketua Program Studi opens either page, then each page holds only
  what belongs to their program, as today.
- The counts on the pages (members, academic classes, students) stay the
  totals, not the count of one page. Confirmed by a check.
- The database is asked only for the rows of the page shown. Confirmed
  by a check.
- On a phone the lists stay cards with no sideways scroll.

## Not included

- Any change to what the lists show or to their order.
- The group history and the mentor's group history, which stay short.

## Decided

1. 25 per page, as the group list and the survey results of this menu.
2. Each list has its own page number in the address, so paging one does
   not move the other lists of the page.

## Steps

- [ ] 1. "Anggota kelompok" and "Mahasiswa binaan" are read and shown a
  page at a time, with checks.
