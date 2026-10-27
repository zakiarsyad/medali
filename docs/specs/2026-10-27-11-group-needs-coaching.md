# Perlu pembinaan on the mentor group page

Depends on: Scores on the mentor group and mentor pages, Character coaching list
Group: Pengasuh

## What we want

A group page shows how many of its members need character coaching. This
part was left out of "Scores on the mentor group and mentor pages"
because it needed the Pembinaan karakter list, which is now built.

## Who it is for

- Kepala Unit, Direktur / Wakil Direktur and Pegawai UPK: every group.
- Ketua Program Studi: the groups of their program only.

## What should happen

- When one of the four roles opens a group, then "Pengasuh saat ini"
  also shows "Perlu pembinaan" as "(n) mahasiswa (x%)", next to
  "Catatan pengasuhan 90 hari": the active members on Pembinaan karakter
  who are not yet "Selesai", out of the active members, the percentage
  rounded to a whole number.
- When a group has nobody on Pembinaan karakter, or no active member,
  then it shows "0 mahasiswa (0%)".
- When a group has 4 active members, one of them on Pembinaan karakter
  and not "Selesai", one on it and "Selesai", and a member on Cuti on
  it, then it shows "1 mahasiswa (25%)". Confirmed by a check.
- When a member's coaching is marked "Selesai", then the number follows
  on the next load.
- When Ketua Program Studi asks by hand for a group outside their
  program, or Pengasuh or Mahasiswa for any, then it is refused.
  Confirmed by a check.

## Not included

- Anything else on the group or mentor pages.

## Decided

1. Members on Cuti are not counted, neither on the list nor in the
   total: active members only, as for "Rerata MEDALI".
2. Who is on Pembinaan karakter is read from the one rule the Character
   coaching list uses; it is not worked out again here.

## Steps

- [x] 1. "Perlu pembinaan" in "Pengasuh saat ini" on the group page,
  with checks.
