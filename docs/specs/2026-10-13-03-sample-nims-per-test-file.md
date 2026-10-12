# Sample NIMs shared by two test files

Depends on: Student list and detail, Mentor groups
Group: Groundwork
Kind: fix, found while building "Groundwork: Row limit of an account with several roles"

## What we want

The checks sometimes fail on a change that is correct, and pass when
they are run again. Two test files of the Mahasiswa area add sample
students with the same NIMs, in a different order, at the same moment.
Each then waits for the other, and the database stops one of them with
"deadlock detected". After this work no two test files add a student
with the same NIM, so the checks pass or fail for the change alone.

What happens today, on a local computer with the full checks run three
times on a correct change: one run failed and two passed. The run that
failed stopped in the checks of the Mahasiswa list, on adding the
sample student with NIM 9900000315, with "deadlock detected". The
checks of which students an account may see add the NIMs 9900000311 to
9900000316, with 9900000315 before 9900000313. The checks of the
Mahasiswa list add 9900000313, 9900000314 and 9900000315 in that
order, and other NIMs of the same range in other cases.

## Who it is for

Everyone who builds on this repo, and the builders whose PR waits on
the checks.

## What should happen

- When the full checks are run, then no two test files add a student
  with the same NIM. Each test file of the Mahasiswa area keeps its
  own range of sample NIMs, and says so at its top.
- When a test file is added later with a NIM that another test file
  already uses, then a check fails and names both files. Confirmed by
  a check.
- When the full checks are run 10 times in a row on `main`, then none
  of them stops with "deadlock detected".
- When the checks run, then they test the same cases as today. Only
  the sample NIMs change.

## Not included

- Any change to the app or to its sample data.
- Any change to how the test database is shared between copies of the
  repo.
- The same question for other sample values, such as names of study
  programs: no failure was seen there.

## Decided

The issue had no open questions. It decided: the sample NIMs are
renumbered in the test files, not the order in which they are added,
because an own range per file also keeps later test files from running
into each other.

Decided while building, because the issue did not say:

1. A range is made of blocks of 100 NIMs. The first 8 digits of a
   sample NIM name its block, and a block belongs to one test file.
   The check fails when two test files use the same block, and names
   the block and both files.
2. The check reads every test file of the app, not only those of the
   Mahasiswa area, because the tests of the other areas add students
   too. Their NIMs were already apart, except in two pairs of the
   Kelompok pengasuhan area, which are renumbered as well.
3. The check looks at what is written in a test file, not at whether
   the file adds the student to the database. A test file that only
   reads a NIM, such as a check of an address, keeps its own block
   too. This is simpler, and a file that starts adding students later
   is already apart.
4. A sample NIM in a test file starts with 99, as all of them do
   today. The check reads every number of 8 to 10 digits that starts
   with 99, so it also sees the start of a NIM that a test puts
   together from parts or searches by.
5. A test file that makes a long row of NIMs from one number, such as
   the checks of a list that is longer than a page, is seen by the
   check through that first number only. Each such file is given room
   after its first number.
6. The line at the top that names the range is added to the test
   files of the Mahasiswa area, as the issue says. The check reads
   the two ends written in that line like any other NIM, so a range
   named there is kept for its file. It does not compare the line
   with the NIMs below it.
7. A test file of the Mahasiswa area that only reads a NIM and already
   had it to itself keeps its NIMs. The files renumbered are those
   that shared a block.

## Steps

- [x] 1. Each test file of the Mahasiswa area has its own range of
  sample NIMs, with a check that no NIM is used by two test files.
