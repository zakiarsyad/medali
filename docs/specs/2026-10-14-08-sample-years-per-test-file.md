# Tahun akademik shared by two test files

Depends on: Sample NIMs shared by two test files, Student survey period, Attendance verification
Group: Groundwork
Kind: fix, found while building "Pengasuh: Tetapkan at the same moment as a student is placed or removed"

## What we want

The checks sometimes fail on a change that is correct, and pass when
they are run again. Two test files add the same sample Tahun akademik
at the same moment, in a different order. Each then waits for the
other, and the database stops one of them with "deadlock detected".
After this work no two test files add the same Tahun akademik, so the
checks pass or fail for the change alone.

What happens today, on a local computer with the full checks run twice
on a correct change: the first run failed and the second passed. The
run that failed stopped on adding the sample period Ganjil 2160/2161,
with "deadlock detected", and 2 checks of one test file failed. The
checks of what a student sees of their activities add the Tahun
akademik 2160 first and 2159 later. The checks of changing a survey
period add 2159.

## Who it is for

Everyone who builds on this repo, and the builders whose PR waits on
the checks.

## What should happen

- When the full checks are run, then no two test files add the same
  sample Tahun akademik. Each test file that adds one keeps years of
  its own, and says so at its top.
- When a test file is added later with a sample Tahun akademik that
  another test file already adds, then a check fails and names both
  files. Confirmed by a check.
- When the full checks are run 10 times in a row on `main`, then none
  of them stops with "deadlock detected".
- When the checks run, then they test the same cases as today. Only
  the sample years change.

## Not included

- Any change to the app or to its sample data.
- Any change to how the test database is shared between copies of the
  repo.
- The same question for other sample values that no failure was seen
  for.

## Decided

The issue had no open questions. It decided:

- The sample years are renumbered in the test files, not the order in
  which they are added, as was done for the sample NIMs, because years
  of its own per file also keep later test files from running into
  each other.
- The check that names two files looks at test files that add an
  academic period, the same way the check of sample NIMs looks at
  NIMs.

Decided while building, because the issue did not say:

1. A year is written in a test file in many places that add no
   period: an angkatan, a date, a day that stands for today. So the
   check cannot tell the years a file adds from the numbers written in
   it, as it can for a NIM. It reads the line at the top of the file
   instead, which names the first and the last year the file adds. The
   check fails when the years of two files meet, and names the years
   and both files.
2. The line at the top is kept true by the checks themselves. The
   checks share one database, and every check runs inside a change
   that is undone. Before it is undone, the years that the check added
   are compared with the line at the top of its test file. A check
   that added a year its file does not name fails, and says which year
   and which file. A check that ends on a save the database refused
   cannot be read, because the database answers nothing more after
   that, so for that kind the line is not compared. A test file that
   adds a period itself must have the line at its top, or a check
   fails and names it.
3. A sample Tahun akademik of a test file is from 2090 to 9999, not
   from 2100 as first decided. The form that adds a period takes no
   year after 2100, and two test files add their periods through it,
   so they need years of their own that the form takes. The years
   before 2090 are left to the app's sample data, which follows
   today's date. A test file that loads the app's sample data says so
   in its line at the top, and adds those years besides its own. Such
   files stay as they are: changing the sample data is not included,
   and they all load it in the same order, so one waits for the other
   and neither is stopped.
4. This covers the test files that use the database the checks share.
   A test file with a database of its own, such as the checks of two
   saves at the same moment, meets no other file there, so it cannot
   be stopped this way. It keeps its years and gets no line.
5. A test file whose years no other test file adds keeps them. The
   files renumbered are those that shared a year, and those that added
   a year before 2090. Of two files that shared a year with each other
   only, one is renumbered and the other keeps it.
6. When a test file is renumbered, its dates, its names and its
   expected words move with the year. The cases stay the same. Where
   a student's semester follows from the year, the angkatan moves
   with it. Four test files took a period of 2026 from a shared helper;
   each now writes its own period. One check asks for the period of
   today with no day given, so its period keeps days in the past under
   a year of its own.
7. Two periods of different years can still wait for each other when
   their days overlap, because the database refuses overlapping days.
   Nearly every test file gives a year its usual days. One check, of
   opening a survey period on the day of today, gives a year of its
   own the days around today, which are also days of the app's sample
   data. No failure was seen for this, so it is not checked and that
   check stays as it is.
8. The line "those of the app's sample data" is taken at its word: a
   file with that line may add any year before 2090. No file adds one
   except by loading the sample data, so it is not checked how the
   year was added.

## Steps

- [x] 1. Each test file that adds a sample Tahun akademik has years of
  its own, with a check that no year is added by two test files.
