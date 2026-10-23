# Head of unit handover

## What we want

Today nobody can hand the Kepala Unit role to a new person: the role cannot
be given or taken in Pengguna dan peran, and the campus server command for
the first account refuses while a Kepala Unit exists. Kepala Unit can now
hand the role to another staff account, and the server keeper has one
command for when the old Kepala Unit is gone and cannot do it.

## Who it is for

- Kepala Unit, who hands the role over.
- The staff member who receives it.
- The campus server keeper, for the command.

## What should happen

- When Kepala Unit opens Pengaturan > Pengguna dan peran, then every active
  staff account that is not Kepala Unit shows "Jadikan Kepala Unit" next to
  "Edit peran". Student accounts do not show it.
- When Kepala Unit presses "Jadikan Kepala Unit" on an account, then the
  app asks: "Serahkan jabatan Kepala Unit kepada <nama>? Anda tidak lagi
  menjadi Kepala Unit." Pressing "Batal" changes nothing.
- When Kepala Unit confirms, then the other account becomes Kepala Unit and
  keeps its other roles, and the one who handed over stops being Kepala
  Unit but keeps their other roles. On the next page they no longer see
  what only Kepala Unit sees. Confirmed on the preview with Ganti peran.
- When the one who handed over had no other role, then their account is
  removed at the handover (marked removed, not erased), as if Kepala Unit
  had pressed "Hapus".
- When the handover is done, then both changes are written to the log of
  role changes: who, when, and the roles before and after. Confirmed by a
  check.
- When the chosen account was removed or became Kepala Unit meanwhile, or
  is a student account, then the handover is refused with a message in one
  line and nothing changes. Confirmed by a check.
- When an account that is not Kepala Unit sends a handover anyway, then it
  is refused and nothing changes. Confirmed by a check.
- When the server keeper runs the handover command with a full name and a
  campus address, then that account becomes Kepala Unit (it is made first
  when no active account has that address), and every other Kepala Unit
  stops being one, the same way as above. It writes to the log, never
  prints the name or address back, and refuses a non-campus address or a
  student account. Confirmed by a check.

## Not included

- More than one way to choose the new Kepala Unit, such as a search box.
- Giving the right to manage users to a role other than Kepala Unit.
- A screen showing the log of role changes.

## Open questions

None. Settled with the owner: the Kepala Unit in office hands over; the
old account stops being Kepala Unit at once; a server command covers a
Kepala Unit who is gone.

## Steps

- [x] 1. The handover rule: the role moves to another active staff
  account, the old account keeps its other roles or is removed when it has
  none, refusals, and the log, with its checks.
- [x] 2. "Jadikan Kepala Unit" with its question on Pengguna dan peran,
  with its checks.
- [ ] 3. The handover command on the campus server, and its part in the
  hosting guide, with its checks.
