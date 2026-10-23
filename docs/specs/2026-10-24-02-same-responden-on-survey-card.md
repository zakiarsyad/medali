# Same Responden on the period card and the survey results

Depends on: Student survey results
Group: Pengasuh

## What we want

On the tab "Evaluasi oleh mahasiswa", the card of the running period
and "Hasil evaluasi per kelompok" count Responden the same way, so one
page never shows two different numbers for the same period.

## Who it is for

- Kepala Unit, Direktur / Wakil Direktur, Pegawai UPK, and Ketua
  Program Studi (their program's groups only): everyone who reads the
  tab.

## What should happen

- When a student who answered the survey goes on Cuti, becomes Non
  aktif or moves to another group while the period is Dibuka, then the
  card's Responden still counts their answer and counts them among the
  students, as the table above it does: "(answers) dari (n) (share%)".
- When nobody's status changed, then the card shows the same numbers as
  before.
- When Ketua Program Studi opens the tab, then the card counts only
  their program's groups, as before.
- When the card and the Responden number above the table are read for
  the same period, then they show the same answers and the same number
  of students. Confirmed by a check.

## Not included

- Any change to how the table, the averages or the fixed lines count
  answers.
- The cancel question of "Batalkan periode", which already counts every
  answer of the period.

## Decided

1. The card follows the table's rule, not the other way round: an
   answer that was sent is never left out later, because the change
   would show what that student said.
2. The students counted are the Aktif members of today's groups in
   force, together with each student who answered and is not one of
   them, each student once.

## Decisions made while building

3. The card takes its two numbers from the same reading the table uses
   for the running period, so they cannot drift apart again. Its
   answers are every answer of the period sent for a group the account
   may see; its students are the members of those groups as the table
   counts them.
4. As in the table, only the groups that had started by today count. A
   group whose first day lies ahead is no longer counted on the card;
   its members cannot answer yet.
5. As in the table, each group counts its students once. A student who
   answered for one group and has since moved to another group the
   account may see is counted in both: among the students of the group
   they answered for, and as an Aktif member of their new group. The
   table already counts them so, and this issue keeps the table as it
   is.
6. While the period is Terjadwal nobody has answered yet, so the card
   shows 0 out of the Aktif members of the groups that have started.

## Steps

- [ ] 1. The card counts Responden by the table's rule, with a check
  that both give the same numbers.
