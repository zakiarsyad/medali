# Mentor name opens the mentor page

Depends on: Mentor groups, Mentor list

## What we want

In the prototype, a mentor's name is a link to that mentor's page: in
the panel "Pengasuh saat ini" on the page of a group, and on the line
"Pengasuh" in the student detail. "Mentor groups" was built before the
mentor page existed, so on the group page the name is plain words, and
in the student detail the name links to the group's page instead.
"Mentor list" added the mentor page but did not change those two
places. After this work the name leads to the mentor's page, for the
accounts that may open it.

## Who it is for

- Kepala Unit, Direktur / Wakil Direktur and Pegawai UPK.
- Ketua Program Studi, for a mentor who holds a group of their program.

## What should happen

- When one of the four roles opens the page of a group that has a
  mentor today, then the name in "Pengasuh saat ini" is a link, and
  pressing it opens that mentor's page under Pengasuh > Pengasuh.
- When an account that may open the mentor's page opens a student
  detail, then the mentor's name on the line "Pengasuh" is a link to
  the mentor's page, and the group code under it is a link to the
  group's page.
- When an account may not open that mentor's page, then the name is
  plain words and no link: any role without the right to see mentors,
  and Ketua Program Studi for a mentor who holds no group of their
  program. Confirmed by a check.
- When a link to a mentor's page is shown, then pressing it never
  leads to "Akses ditolak" or "not found": the link is decided by the
  same rule that answers the mentor's page. Confirmed by a check.
- When an account has several roles, then only its roles that may see
  mentors decide the link. Confirmed by a check.
- When the group page or the student detail is opened on a phone, then
  there is still no sideways scroll.

No case was met on `main` before this spec: on the group page the name
was plain words, and in the student detail the name led to the group's
page and the group code was plain words. All of it is built here.

## Not included

- Links on earlier mentors: the names in "Riwayat pengasuh kelompok"
  and after "Sebelumnya:" stay plain words.
- The Pengasuh column of the Mahasiswa list: the name stays plain
  words there, as in the prototype.
- Any change to who may see mentors, groups or a student detail.

## Better than the prototype

- A name is a link only for an account that may open the page behind
  it, so no link ends in a refusal.

## Decided

1. In the student detail the group code becomes the link to the
   group's page, for the accounts that may open that group, because
   the name now leads to the mentor. An account that may open neither
   sees both as plain words, as today.
2. A student whose group has no mentor today keeps "Belum ditetapkan"
   as plain words.
3. Decided while building, since the issue did not say: for a group
   with no mentor today, the group code under "Belum ditetapkan" is
   still a link to the group's page, for the accounts that may open
   that group. Decision 1 gives the link by the right to open the
   group, not by whether it has a mentor.

## Steps

- [x] 1. One rule gives the address of a mentor's page for an account
  that may open it, or nothing, with tests.
- [x] 2. The name in "Pengasuh saat ini" on the group page links to
  the mentor's page.
- [x] 3. In the student detail the name links to the mentor's page and
  the group code to the group's page.
