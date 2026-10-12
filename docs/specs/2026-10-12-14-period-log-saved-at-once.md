# The log of period changes when two windows save at once

Kind: fix, found by "App-wide audit: Groundwork"

## What we want

When the dates of one academic period are saved from two windows at the
same moment, the log of period changes gets a wrong "before" on its
second line. After this work each line of the log says what the period
really held just before that change.

What happens today, as Kepala Unit on Pengaturan > Periode akademik, on
a local computer with sample data: Genap 2026/2027 ran from 1 Feb 2027
to 31 Jul 2027. One window saved 10 Feb 2027 to 31 Jul 2027, another
saved 12 Feb 2027 to 30 Jul 2027, both at the same moment. Both said
"Tanggal periode Genap 2026/2027 diubah." and the period ended with the
dates of the second save, which is fine. But both lines in the log say
"before: 1 Feb 2027 to 31 Jul 2027". The second line should say
"before: 10 Feb 2027 to 31 Jul 2027", so the log skips a step and cannot
be read as a chain.

Two saves that would overlap each other are already refused, and so is
the same new period added twice: those need no change.

## Who it is for

Kepala Unit, and anyone who later reads the log of period changes.

## What should happen

- When two windows save different dates for the same period at the same
  moment, then the period ends with the dates of the save that was taken
  last, and the log holds one line for each: the "before" of the second
  line is the "after" of the first. Confirmed by a check that sends two
  saves at once.
- When the save taken second asks for the dates the period now holds,
  then nothing is saved, no line is added, and it says "Tanggal masih
  sama, tidak ada yang diubah." Confirmed by a check.
- When the save taken first moves the end of the period to before
  today, then the save taken second is refused with "Periode yang sudah
  selesai tidak bisa diubah lagi." Confirmed by a check.
- When one window alone changes the dates of a period, then everything
  works as today, with the same messages.

Already met before this work: the last case. One window alone is left
alone.

## Not included

- Telling the second window that someone else changed the period in the
  meantime. The save taken last stands, as today.
- Any change to the screen.
- The log of role changes: it has its own issue, "Groundwork: Roles of
  one account saved from two windows at once".

## Decided

The issue had no open questions. Decided while building, because the
issue did not say:

1. A log line for a change of dates now carries the time it was written,
   not the time its save began, as the log of role changes already does.
   A save that began first but was taken second would otherwise get the
   earlier time, and the log read by time would show the two lines in
   the wrong order.
2. A save alone can never move the end of a period to before today: it
   is refused with "Selesai tidak boleh sebelum hari ini." So the third
   case is reached only when midnight passes between the two saves: the
   first moves the end to its today, and for the second that day is
   already yesterday. The check sends the two saves with those two days.

## Steps

- [ ] 1. A change of dates reads the period and writes its log line in
  one go, with a check that sends two saves at once.
