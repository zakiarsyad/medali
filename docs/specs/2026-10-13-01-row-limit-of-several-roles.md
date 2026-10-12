# Row limit of an account with several roles

Depends on: Student list and detail, Mentor groups
Kind: fix, found while building "Pengasuh: Mentor groups"

Urgent: an account with a certain mix of roles can open personal data
of students that none of its roles allows.

## What we want

An account with several roles may do everything that any of its roles
allows, and nothing more. Today the right to open a screen comes from
one role, but the rows shown there come from all the account's roles
put together. So a role that sees every student for its own screens
also widens what another role's screen shows.

What happens today, read in the code of the merged app and confirmed
by the rule's own behaviour: an account that is both Ketua Program
Studi and Pegawai UPK opens the student detail of every student of
every study program. Ketua Program Studi may open the detail only for
its own program, and Pegawai UPK may not open a student detail at all.
The same happens for Ketua Program Studi together with Konselor,
Penilai Mahasiswa, Pembina Disiplin Mahasiswa or Pengelola Asrama, and
for a Pengasuh with one of the roles that see every student. The same
widening reaches the Mahasiswa list, the groups under Pengasuh >
Kelompok pengasuhan, and the lists under Asrama.

After this work, the rows a screen or an action shows are the rows of
only those roles of the account that allow that screen or action.

## Who it is for

Every account with more than one role, and the students whose data
they would otherwise see.

## What should happen

- When an account opens a screen or sends a request, then the rows it
  gets are the rows of the roles that allow that screen or action, put
  together. Roles of the account that do not allow it add no rows.
- When an account that is Ketua Program Studi and Pegawai UPK opens the
  Mahasiswa list or a student detail, then it sees only the students of
  its own study program, and a hand-made request for a student of
  another program is refused. Confirmed by a check.
- When that account opens Pengasuh > Kelompok pengasuhan, then it sees
  every group, because Pegawai UPK may see every group there. Pressing
  a member opens the detail only for a student of its own study
  program; any other member is not a link, and a hand-made request for
  it is refused. Confirmed by a check.
- When an account that is Ketua Program Studi and Konselor opens
  Pengasuh > Kelompok pengasuhan, then it sees only the groups of its
  own study program. Confirmed by a check.
- When an account that is Pengasuh and also holds a role that sees
  every student opens a screen that only its Pengasuh role allows, then
  it sees only the students of the groups it holds today. Confirmed by
  a check.
- When two roles of one account both allow the same screen, then the
  account sees the rows of both, as today. Confirmed by a check.
- When an account has one role only, then everything works as today.
- When the list of what each role may do is shown to Kepala Unit, then
  it is unchanged.

Already met before this work: the last two cases. An account with one
role and the list of what each role may do are left alone.

## Not included

- Any change to what a single role may see or do.
- Any new role, screen or permission.
- Any change to the screens.

## Better than the prototype

- The prototype lets one person act as one role at a time. The app
  joins the roles, so it must also keep each role's rows to that
  role's own screens.

## Decided

The issue had no open questions. It decided: the rows follow the roles
that allow the screen or action being used. Between showing more and
showing less personal data, the app shows less to fewer people.

Decided while building, because the issue did not say:

1. The Mahasiswa list has no named action of its own, and this work
   adds no permission. Its rows are those of the roles that may open
   the Mahasiswa page. The student detail, the mentor groups and the
   two Asrama lists each have a named action, and take the rows of the
   roles that allow it.
2. A hand-made request for the detail of a student outside the
   account's rows gets the answer "not found", as it does today for an
   account with one role. Nobody learns from the answer whether that
   student exists.
3. On the page of a group, whether a member is a link is decided for
   each member, by the same rule that answers the request for that
   member's detail. So a link never leads to "not found".
4. Under Asrama > Kakak pendamping, the students that can be named as
   kakak pendamping keep the rows of the list. Every role that may
   name one sees every student, so nothing differs today.
5. No screen exists yet that shows students and that only Pengasuh
   opens. The case for Pengasuh is confirmed by a check on the rule,
   with the page Pengasuhan, which an account that is Pengasuh and
   Penilai Mahasiswa opens through Pengasuh alone.

## Steps

- [x] 1. The row limit is asked for a named action and counts only the
  roles that allow it, with tests for each mix above.
- [x] 2. The Mahasiswa list, the student detail, the mentor groups and
  the Asrama lists ask the row limit for their own action, with checks
  for the refused requests.
