# Own activities and attendance of a resident who is also BAM

Depends on: Asrama: Dorm activities, Asrama: Dorm attendance
Group: Asrama

## What we want

A student who lives in the dorm can also hold a BAM role, which lets them
see the dorm schedule. Kegiatan asrama then shows them only the staff
screen: Jadwal harian, and Penghitungan kehadiran for BAM. They never see
their own resident part: "Hari ini", "Akan datang", the note on how
attendance is counted, "Kehadiran kegiatan asrama", "Tercatat tidak
hadir", "Kegiatan hari ini" and Riwayat. The building rules say a person
with several roles may do everything any of their roles allows, and use
"a student who is also a BAM member" as the example. Such an account sees
both parts.

## Who it is for

- A resident of the dorm who also holds a role that may see the dorm
  schedule, such as a BAM role.

## What should happen

- When an account that lives in the dorm and may see the dorm schedule
  opens Kegiatan asrama, then it sees its own resident part (the
  attendance numbers with the note, "Hari ini", "Akan datang" and
  Riwayat) above the staff screen (Jadwal harian, and Penghitungan
  kehadiran when it may count). Confirmed by a check.
- When an account may only see the dorm schedule and does not live in the
  dorm, then nothing changes: it sees the staff screen only, as today.
- When a resident holds no role that may see the dorm schedule, then
  nothing changes: they see the resident part only, as today.
- When that account's resident part is shown, then it holds only their
  own activities and marks, the same as for a resident with no other
  role. Confirmed by a check.
- When it is seen on a phone, then both parts stack with no sideways
  scroll.

## Not included

- Any change to what the staff screen or the resident part shows on their
  own.
- Other pages where one account holds a staff role and the Mahasiswa role.

## Better than the prototype

- Nothing new. The prototype shows one role at a time through Ganti
  peran. This follows the building rules on accounts with several roles.

## Decided

- The resident part comes first, above the staff screen, on the same tab,
  because it is the account's own data and is short. Neither part
  changes.
- Decided while building: an account that sees both parts gets the staff
  screen's page heading. The room line that heads the page for a resident
  alone is not shown then, because it is not part of the resident part
  this spec lists.
- Decided while building: the warning a resident sees above their part,
  when a clarification of theirs was rejected or they have an SP, comes
  with the resident part, because it is about their own attendance.

## Steps

- [x] 1. Kegiatan asrama shows the resident part above the staff screen
  for an account that lives in the dorm and may see the dorm schedule,
  with a check for an account holding Mahasiswa and a BAM role.
