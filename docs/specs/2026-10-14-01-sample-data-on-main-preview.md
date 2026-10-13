# Sample data of merged features on the preview of main

Depends on: File storage, Own database for each copy of the repo
Group: Groundwork

## What we want

The preview of `main` holds almost none of the sample data the merged
features need, so most of them cannot be tried there.

Seen in "Audit: Pengasuhan" on the preview of `main`, read as Kepala
Unit without changing anything:

- Mahasiswa lists 17 students. The sample data of the repo has 198.
- Pengasuh > Kelompok pengasuhan has no group, and "Riwayat
  penggantian" and "Evaluasi terbaru" are empty.
- Pengasuhan shows "Belum ada catatan." and "Belum ada kelompok
  pengasuhan yang dapat Anda lihat." to Kepala Unit, Direktur / Wakil
  Direktur and Ketua Program Studi, and "Anda belum memegang kelompok
  pengasuhan." to every Pengasuh. No note, attendance list or score can
  be written or read.
- Kegiatan karakter > Kegiatan PPKS shows "Belum ada jadwal kegiatan."
- "Ganti peran" offers two Pengasuh accounts. The sample data has
  eight.

The cause: a deploy of `main` fills its database with sample data only
once, the first time, when the database is empty. Every feature merged
since then brought its own sample data (groups, mentors, notes,
meetings, scores, replacements, schedules, dorm rooms), and none of it
reached the preview of `main`.

This matters because a PR no longer has a preview of its own. The
preview of `main` is where the owner tries merged work, each spec asks
that its screens show "within about 1 second on the preview", and each
audit is told to look at the preview of `main`. With no groups there,
none of that can be done for Pengasuh and Pengasuhan, and the same will
happen to each coming feature.

The preview of `main` must hold the sample data of the `main` it shows.

## Who it is for

The owner, who tries merged work on the preview of `main`, and every
builder and audit that checks there.

## What should happen

- When `main` is deployed and the deploy applied at least one new table
  change, then the database of the preview of `main` is started over:
  its tables are made again and filled with the sample data of that
  `main`, as a PR deploy did for the PR preview database.
- When `main` is deployed and no table change was new, then the data is
  kept as it is, as today.
- When the database of the preview of `main` holds sample data from
  before this work, then the first deploy of `main` after this work is
  merged starts it over once, also when that deploy brings no table
  change. Afterwards Mahasiswa lists the sample students, Kelompok
  pengasuhan lists the sample groups, and Pengasuhan shows notes,
  meetings and scores to each role within its rows.
- When the database is started over, then the files of the preview of
  `main` in the file storage are started over with it, so no attendance
  photo or uploaded file is left without its row, and no row without
  its file.
- When the step runs, then it still checks first that the database is
  the one marked for the preview of `main` and that the build comes
  from `main`. A database marked for the campus server or for PR
  previews is refused, and so is a production deploy from another
  branch or from the command line, all as today. Confirmed by a check.
- When the app runs on the campus server, then nothing of this runs:
  the sample data and its commands are not in the campus package, as
  today. Confirmed by a check.
- When a deploy of `main` starts the database over, then the build log
  says so in one line, and says "data kept" when it did not.
- When this is merged, then `docs/HOSTING.md` and the line on the two
  preview databases in `CLAUDE.md` say what a deploy of `main` now
  does.

## Not included

- The PR preview database and what a PR deploy does.
- New sample data. Each feature keeps bringing its own.
- Removing real people's data from the preview of `main` (Owner: staff
  accounts on the preview of main that are not sample data). Starting
  the database over does remove every account that is not in the sample
  data; that issue stays the owner's to close.
- Google sign-in on the preview: its settings are not in the database
  and are not touched.

## Better than the prototype

Nothing to compare: the prototype has no server and no database.

## Decided

1. The database is started over, not topped up. The sample data command
   makes every table again and fills it; it cannot add to rows that are
   already there, and the sample students of today are not the 17 the
   preview holds.
2. It is started over only by a deploy that applied a new table change,
   not by every deploy. A feature that brings sample data brings its
   tables with it, and a merge that changes no table, such as a fix to a
   screen, leaves what the owner was trying in place.
3. What was added by hand on the preview of `main` is lost when it is
   started over. That is accepted: the previews hold sample data only,
   and "Ganti peran" gives every sample account back at once. Nobody was
   asked; the owner can change this with a new issue.
4. How the database knows it was started over by this work, for the one
   start after the merge, is a mark kept in the database beside the mark
   that says which preview it belongs to. No table of the app is added.
5. Starting the files over reuses what a PR deploy does for the PR
   preview's part of the file storage, on the part named for the
   preview of `main`, which the step that empties refuses today. It
   empties that part only in a deploy that also starts the database
   over, and never the part of the campus server. While the file storage
   settings are empty the step does nothing, as today.

## Decisions made while building

Already met on `main` before this work, and kept: the checks that guard
the step (the mark of the database, and the branch of the build), and
that the campus package holds no sample data and none of its commands.
Everything else was built here. The issue did not say, so these were
decided:

6. A deploy of `main` that brings a new table change does not apply it
   on top of the old data first. It makes every table again from all
   the table changes and then fills them, as a PR deploy does. The
   result is the same, and a table change that the old rows would
   refuse cannot stop the deploy.
7. A database of the preview of `main` that holds no account is started
   over too, as before this work. That also repairs a start that failed
   half way, after the tables were made and before they were filled.
8. The mark is written only after the sample data is in. A start that
   fails before that is tried again by the next deploy.
9. The database step and the file storage step are two commands of the
   build, so the mark also says whether the files of that start were
   emptied yet. The file storage step empties the part of the preview
   of `main` only while the mark says a start still waits for it, and
   then notes it as done. If the file storage step fails after the
   database was started over, the next deploy of `main` empties the
   files, also when that deploy keeps the data.
10. While the file storage settings are empty the step empties nothing
    and the start keeps waiting. The first deploy after the owner fills
    them in then empties the part of the preview of `main` once. No
    file of the app can be there before that, so nothing is lost.
11. The build log of the file storage step says in one line whether the
    files of `main` were emptied, with how many, or kept.

## Steps

- [x] 1. A deploy of `main` that applied a new table change starts the
  database of the preview of `main` over with sample data, after the
  checks that guard it today.
- [ ] 2. The first deploy after this work starts it over once, by a
  mark in the database.
- [ ] 3. The files of the preview of `main` are started over together
  with its database.
- [ ] 4. `docs/HOSTING.md` and `CLAUDE.md` say what a deploy of `main`
  does to its database.
