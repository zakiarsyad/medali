# Database code sent to the browser on Penetapan angkatan baru

Depends on: New intake assignment
Group: Pengasuh

## What we want

The tab "Penetapan angkatan baru" of the Pengasuh menu sends the
description of every database table to the browser. The form that forms
the groups, which runs in the browser, takes the list of methods from a
file that reads it from the table definitions, so the whole of the table
definitions and the database library come along: about 49 KB that the
browser loads and never uses. The building rules say only the server
talks to the database, and that the app must be cheap to run. The tab
must load without them, and nothing on screen changes.

Found while building "PPKS activity schedule", which had the same fault
in its own tab and fixed it there.

## Who it is for

Everyone who opens "Penetapan angkatan baru": Kepala Unit, Pegawai UPK,
Direktur / Wakil Direktur and Ketua Program Studi. Nobody sees a
difference.

## What should happen

- When the app is built, then no file the browser loads for "Penetapan
  angkatan baru" holds the name of a database table, such as
  `cohort_assignments` or `ppks_activities`. Confirmed on a local
  computer, by building the app and searching the files made for the
  browser.
- When a part of this tab that runs in the browser takes anything, also
  through other files, from the table definitions or the database
  library, then a check fails. Confirmed by a check.
- When Kepala Unit or Pegawai UPK opens the tab, then the form that
  forms the groups shows the same methods, in the same order and with
  the same words as before, and forming the groups works as before.
- When a method that is not in the list is sent by hand, then the server
  still refuses it. Confirmed by a check.

The third and the fourth case were met on `main` before this spec, and
stay as they were. The first and the second are built here.

## Not included

- The same search over every other menu. If another tab has the fault,
  it gets its own issue.
- Any change to the tables or to what the tab does.

## Better than the prototype

Nothing to compare: the prototype has no server and no database.

## Decided

1. The list of methods is written once in a file with no database code,
   and the table definitions take it from there, as they already do for
   the roles and for the kinds of a mentoring note. The database is not
   changed, so no table change file is made.
2. The check is the same kind as the one "PPKS activity schedule" added
   for its tab: it follows what the browser parts of the area take in,
   file by file, and fails when it reaches the table definitions or the
   database library.

## Decisions made while building

The issue did not say, so these were decided:

3. The list of methods stays in the file of this area that already
   holds the words of each method. Only this area and the table
   definitions use it, so it is not moved to a shared place.
4. The part of the check that follows what a file takes in is moved,
   unchanged, to a shared place, and the check of "Kegiatan karakter"
   and the new one both use it. Two copies of it would have to be kept
   alike by hand.

## Steps

- [x] 1. The list of methods lives in a file with no database code, and
  the form and the table definitions both take it from there.
- [x] 2. A check fails when a browser part of "Penetapan angkatan baru"
  reaches the table definitions or the database library.
