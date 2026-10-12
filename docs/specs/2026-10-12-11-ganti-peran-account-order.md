# Order of accounts on Ganti peran

Kind: fix, found by "Audit: UI of the merged screens"

## What we want

"Ganti peran" lists the sample accounts with the student accounts in the
middle. With the sample data of the student list there are about 60 of
them, so 13 staff accounts, from Pengelola Asrama to Penilai Mahasiswa
and the account with two roles, sit far below, after every student. On a
phone that is more than 60 boxes to scroll past. After this work the
staff accounts come first.

What happens today, as any account, on a phone and on a computer: the
order is Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi,
Pengasuh, every Mahasiswa account, then all other staff accounts.

## Who it is for

The owner and anyone who tries a preview by switching accounts.

## What should happen

- When "Ganti peran" opens, then all staff accounts come first, in the
  order of the roles in "Hak akses tiap peran", and an account with two
  roles sits at its first role.
- When the staff accounts end, then the student accounts follow, sorted
  by name.
- When an account is picked, then it works as today.

Already met before this work: the last case. Picking an account is left
alone.

## Not included

- A search or a filter on "Ganti peran".
- Showing fewer student accounts.
- Any change to the sample data.

## Decided

Decided while building, because the issue did not say:

1. A student account is an account that holds the role Mahasiswa. Every
   other account counts as a staff account, also the sample BAM accounts,
   as the issue counts them.
2. A student who also holds a BAM role stays among the student accounts,
   at the place of the name. It is not listed a second time with the
   staff accounts.
3. Staff accounts with the same first role are sorted by name, as today.
4. An account with no role that works right now stays at the end of the
   staff accounts, as today.

## Steps

- [ ] 1. "Ganti peran" lists staff accounts first, then students.
