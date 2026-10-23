# Own leave and cleaning of a resident who is also BAM

Depends on: Asrama: Dorm leave requests, Asrama: Return from leave, Asrama: Cleaning duties, Pengaturan: BAM roles for students
Group: Asrama

## What we want

A resident can also hold a BAM role, given on Pengaturan. On Perizinan
asrama, a resident with BAM - BPHK sees only the staff screen. They have
no "Ajukan izin", no own leave history and no way to send their return
photo, so they cannot ask for leave at all. Pembersihan asrama shows only
the staff screen to a resident with BAM - BPHK or BAM - Kerumahtanggaan,
so their own room's duties are not shown. The building rules say a person
with several roles may do everything any of their roles allows, with "a
student who is also a BAM member" as the example. Kegiatan asrama and
Pelanggaran already show both parts to such an account.

## Who it is for

- A resident who also holds BAM - BPHK, or BAM - Kerumahtanggaan.

## What should happen

- When a resident who may see the leave requests opens Perizinan asrama,
  then they see their own resident part ("Ajukan izin", their requests,
  and sending the return photo) above the staff screen. Confirmed by a
  check for an account holding Mahasiswa and BAM - BPHK.
- When a resident who may see the cleaning duties opens Pembersihan
  asrama, then they see their own room's duties, as any resident does,
  above the staff screen. Confirmed by a check for an account holding
  Mahasiswa and BAM - Kerumahtanggaan.
- When the resident part is shown, then it holds only their own requests
  and duties, the same as for a resident with no other role.
- When an account may see these tabs and does not live in the dorm, or a
  resident holds no such role, then nothing changes.
- When it is seen on a phone, then both parts stack with no sideways
  scroll.

## Not included

- Deciding one's own leave, return report or cleaning duty (a separate
  issue refuses it).
- Any change to what the staff screen or the resident part shows on their
  own.

## Better than the prototype

- Nothing new. The prototype shows one role at a time through Ganti
  peran. This follows the building rules, as Kegiatan asrama already does.

## Decided

- The resident part comes first, above the staff screen, on the same tab,
  as on Kegiatan asrama. This replaces, for a resident only, the leave
  spec's decision that an account that may see the requests sees the
  staff screen. That decision was made before a student could hold a BAM
  role.
- Decided while building, as on Kegiatan asrama: an account that sees
  both parts gets the staff screen's page heading. The room line that
  heads the page for a resident alone is not shown then.
- Decided while building: the pages of "Riwayat izin saya" have their own
  name in the address, apart from the pages of the staff list, so turning
  a page of one never turns a page of the other. A resident alone sees
  the same pages as before; only the address differs.

## Steps

- [x] 1. Perizinan asrama shows the resident part above the staff screen
  for a resident who may see the requests, with a check.
- [x] 2. Pembersihan asrama shows the resident part above the staff screen
  for a resident who may see the duties, with a check.
