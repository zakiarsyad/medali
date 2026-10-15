# Database code sent to the browser on Kakak pendamping

Depends on: Dorm companions, Dorm activities
Group: Asrama

## What we want

The tab Kakak pendamping of the Asrama menu sends database code to the
browser. The form "Tetapkan kakak pendamping" runs in the browser. It
takes the rule for which Asrama fits a student from a file that also
builds database queries, so the database library comes along, and the
browser loads it but never uses it. The building rules say only the
server talks to the database, and that the app must be cheap to run.
"Penetapan angkatan baru" had the same fault and it was fixed there. The
tab must load without that code, and nothing on screen changes.

Found while building "Dorm activities". That work added a check for the
browser parts of Kegiatan asrama only, because the Kakak pendamping form
failed it.

## Who it is for

Everyone who opens Kakak pendamping: Pengelola Asrama, Kepala Unit,
Direktur / Wakil Direktur, Ketua Program Studi and BAM - BPHK. Nobody
sees a difference.

## What should happen

- When the app is built, then no file the browser loads for Kakak
  pendamping holds database code, such as the name of a database table
  or the database library. Confirmed on a local computer, by building
  the app and searching the files made for the browser.
- When a part of the Asrama menu that runs in the browser takes
  anything, also through other files, from the table definitions or the
  database library, then a check fails. Confirmed by a check.
- When Pengelola Asrama chooses a student in "Tetapkan kakak
  pendamping", then Asrama is still set from the student's jenis
  kelamin, as before.
- When the chosen Asrama does not fit the student, then the server still
  refuses it with the same message, as before. Confirmed by a check.

The last two cases were met on `main` before this spec, and stay as
they were. The first and the second are built here.

## Not included

- The same search over every other menu. If another tab has the fault,
  it gets its own issue.
- Any change to the tables or to what the tab does.

## Better than the prototype

Nothing to compare: the prototype has no server and no database.

## Decided

1. The rule for which Asrama fits a student goes in a file of the dorm
   area with no database code. The form and the database query both take
   it from there, as "Penetapan angkatan baru" did with its list of
   methods.
2. The dorm area's existing check for browser parts covers every browser
   part of the Asrama menu, not only those of Kegiatan asrama. It uses
   the same shared helper as the checks of "Kegiatan karakter" and
   "Penetapan angkatan baru".

## Decisions made while building

The issue did not say, so these were decided:

3. The rule stays in the file that already holds it, and only the one
   database condition there, "lives in a dorm with kakak pendamping",
   moves to a file of its own. Fewer files change that way.
4. The check finds the browser parts of the Asrama menu by itself, so a
   new one is covered without anyone adding it to a list.

## Steps

- [x] 1. The rule for which Asrama fits a student lives in a file with
  no database code, and the form and the query both take it from there.
- [x] 2. The check for browser parts covers every browser part of the
  Asrama menu.
