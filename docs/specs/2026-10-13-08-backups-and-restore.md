# Backups and restore

Group: Groundwork

## What we want

Before any real data goes in, the campus server package can save
everything it holds and bring it back: the database and the uploaded
files together, as one dated backup. A backup is made by one command and
every night by itself, and one command restores it into an empty
package. Where backups are kept and the password that locks them are
settings the campus fills in.

## Who it is for

The campus IT staff who run the server, and the owner, who tries it on a
local computer first. No role in the app sees a backup.

## What should happen

A preview cannot run the package, so every case here is confirmed on a
local computer or by a check, with sample data.

- When someone runs the backup command on a running package, then one
  dated backup appears in the backup folder. It holds the whole database
  and every uploaded file, taken so that they fit together, and the
  command says its name and size.
- When a backup is written, then it is locked with the backup password
  from the settings and cannot be read without it. When that password
  is empty, then the command refuses, says which setting is missing,
  and writes nothing. Confirmed by a check.
- When the backup folder setting is filled in, then a backup is made
  every night at the hour the setting gives (02:00 at the start), and
  the result goes to the package's log. While the folder setting is
  empty, no nightly backup runs, and the start-up log says "Cadangan
  otomatis belum diatur."
- When there are more backups than the number to keep (14 at the start,
  a setting), then the oldest are removed after a new one succeeds, and
  never before.
- When someone runs the restore command with a backup and the right
  password on a package that holds no data, then the database and the
  files come back, the table changes still needed are applied, and the
  app starts. The same accounts sign in, and a file kept before the
  backup downloads unchanged. Confirmed by a check that compares counts
  and one file.
- When the restore command is run on a package that already holds data,
  then it refuses and changes nothing, unless it is run with the plain
  word that says "replace everything", and then it asks once more.
- When the password is wrong or the backup is broken or cut short, then
  the restore refuses before changing anything and says why. Confirmed
  by a check.
- When a backup or restore fails half way, then no half-written backup
  is left looking like a good one, and the running app keeps its data.
  Confirmed by a check.
- When a backup runs while people use the app, then they notice
  nothing, and no page becomes slower than about 1 second.
- When the package is built, then it holds no backup, no password and
  no folder name. Confirmed by a check.
- When the campus staff read the package's notes, then they find how to
  make a backup, how to restore one, how to try a restore on another
  computer, and that the backup folder should sit on another disk or
  server than the app.

## Not included

- Backups of the previews; their database is sample data.
- Sending backups to a cloud service or by e-mail.
- A screen in the app to make, list or download backups.
- Restoring one student or one table only.
- Moving real data in.
- Choosing the real server and its disks.

## Decided

The open questions, each with the answer that stands.

1. Backups are kept in a folder named by a setting, empty at the start.
   The notes tell the campus to point it at another disk or server.
2. The latest 14 are kept, as a setting the campus may change.
3. A backup is always locked: it holds health, counselling and
   discipline records. Without the password setting no backup is
   written.
4. No new library. It uses the database's own backup tool, the file
   storage's own copy tool and the locking tool that the package's
   system already carries.

## Decided while building

What the spec did not say, decided during the build. A new issue can
change any of these.

1. The package gets a fourth part, the backup part, beside the app, the
   database and the file storage. It holds the three tools and nothing
   of the app, and both commands are run in it. Nothing reaches it from
   outside the server.
2. Four settings in the package's settings file: the backup folder, the
   backup password, the hour of the nightly backup and the number to
   keep. The last two may stay empty: 02:00 and 14 are then used.
3. A backup is one file. Its name is the day and the time it was made,
   in campus time, and it always has the same ending, so a backup is
   told apart from any other file in the folder.
4. "Fit together" means: the database is taken first, in one moment,
   and the files after it. So every file the database names is in the
   backup. A file added while the backup runs may be in it without the
   database naming it, which harms nothing.
5. The locking tool also notices a backup that is broken or cut short,
   so the restore needs no second check for that.
6. The backup command also refuses, and names the setting, while the
   backup folder setting is empty.
7. A backup is written under a name that marks it as unfinished, and
   gets its real name only once it is complete. An unfinished one left
   by a failure or a power cut is removed by the next backup. The
   unlocked working copy is kept inside the backup part, never in the
   backup folder, and is removed when the command ends.
8. A package "holds data" when its database has at least one account,
   removed ones counted. Nothing else can be entered before an account
   exists.
9. The plain word is `GANTI-SEMUA`, given after the backup's name. The
   command then asks to type the same word once more.
10. A restore first adds the backup's files, then replaces the whole
    database in one go, which either happens fully or not at all, and
    only then removes the files the backup does not hold. When it fails
    half way the package keeps the data it had; files already added may
    stay as extra files, which harms nothing.
11. The restore command cannot start the app again by itself. It ends
    by naming the one command that does; that start applies the table
    changes still needed.
12. Only the backup password must be the same on the computer a backup
    is restored on. The other settings may differ.
13. What the two commands and the nightly backup say is in Bahasa
    Indonesia, as the line this spec gives for the start-up log.
14. The nightly hour is campus time, the same fixed time zone the app
    uses for its days.
15. With an hour or a number to keep that cannot be read, the start-up
    log names the setting and no nightly backup runs; the backup
    command refuses in the same way. With the folder filled in and the
    password empty, the start-up log says so, and each night's backup
    refuses.
16. One backup or restore runs at a time. A second one started
    meanwhile refuses.
17. Only files with a backup's name count towards the number to keep,
    and only those are ever removed. Any other file in the folder is
    left alone.
18. A file with a backup's name, finished or not, is kept out of the
    package when it is built, wherever the backup folder is.
19. The check of backups runs the real tools in Docker, on a database
    and a file storage it makes for itself and removes again. So the
    checks need Docker, on a local computer and on GitHub.

## Steps

- [x] 1. The backup command: database and files together, locked, with
  its refusals.
- [x] 2. The restore command into an empty package, with its refusals.
- [x] 3. The check that makes a backup, restores it elsewhere and
  compares.
- [ ] 4. The nightly backup and the number to keep, with their
  settings.
- [ ] 5. Failure handling: no half-written backup, and the app keeps
  running.
- [ ] 6. The notes for the campus staff.
