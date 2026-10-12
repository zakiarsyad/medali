# Roles of one account saved from two windows at once

Kind: fix, found by "App-wide audit: Groundwork"

## What we want

When the roles of one account are saved from two windows at the same
moment, the account can end up with the roles of both saves mixed
together, and the log of role changes does not say so. After this work
two saves for one account are taken one after the other, so the account
always holds what one save asked for, and the log always matches it.

What happens today, as Kepala Unit on Pengaturan > Pengguna dan peran,
on a local computer with sample data: an account held Konselor. One
window saved Pengasuh, another saved Pembina Disiplin Mahasiswa and
Penilai Mahasiswa, both at the same moment. The account then held all
three roles. The log held two lines, both starting from Konselor: one
ending at Pengasuh, one ending at Pembina Disiplin Mahasiswa and Penilai
Mahasiswa. No line showed the three roles the account really had, so
the log could not be trusted for that account.

## Who it is for

Kepala Unit, and anyone who later reads the log of role changes.

## What should happen

- When two windows save different roles for the same account at the
  same moment, then the account ends with exactly the roles of the save
  that was taken last, never a mix of the two.
- When that happens, then the log holds one line for each save that
  changed something, in the order they were taken: the "before" of each
  line is the "after" of the line before it, and the "after" of the last
  line is what the account really holds. Confirmed by a check that sends
  two saves at once.
- When one window removes an account while another saves its roles, at
  the same moment, then the two are also taken one after the other: a
  save that comes after the removal answers "Akun tidak ditemukan.", and
  the "before" of the removal line is what the account really held.
  Confirmed by a check.
- When one window alone saves roles, adds an account or removes one,
  then everything works as today, with the same messages.

Already met before this work: the last case. One window alone is left
alone.

## Not included

- Telling the second window that someone else changed the account in
  the meantime. The save taken last stands, as today.
- Any change to the screen.
- The log of period changes: it has its own issue, "Groundwork: The log
  of period changes when two windows save at once".

## Decided

The issue had no open questions. Decided while building, because the
issue did not say:

1. A log line for a role save or a removal in Pengguna dan peran now
   carries the time it was written, not the time its save began. A save
   that began first but was taken second would otherwise get the earlier
   time, and the log read by time would show the two lines in the wrong
   order.
2. Two removals of one account at the same moment are also taken one
   after the other: the second answers "Akun tidak ditemukan." and
   writes no second line.
3. A student's BAM roles, in the panel Badan Asrama Mahasiswa, are left
   alone: two saves there already wait for each other.

## Steps

- [x] 1. Saves and removals for one account are taken one after the
  other, with a check that sends two at once.
