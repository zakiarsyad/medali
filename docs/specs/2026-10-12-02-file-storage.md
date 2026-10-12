# File storage

## What we want

The app gets a place to keep uploaded files: MinIO on a local computer and
on the campus server, and on the previews a free service that works the
same way as MinIO, named by settings the owner fills in later. Every
upload is checked for type and size, and a file can only be opened by
someone who may see the record it belongs to. To make this something
people can try, Pengaturan > Pengguna baru mahasiswa keeps each CSV file
that was saved through "Unggah berkas", so staff can download the
original file again later.

## Who it is for

- Kepala Unit, Pegawai UPK and Pengelola Asrama, who upload student files.
- Every later feature that takes a photo or a document (proof photos,
  attachments, return reports): they reuse this.

## What should happen

Until the owner fills in the preview's file storage settings, a preview
keeps no file. So every case here is confirmed on a local computer or by
a check, except the two cases that say otherwise.

- When a developer runs the start command, then the file storage starts in
  Docker next to the database, and the app can reach it with the local
  values the example settings file gives.
- When one of the three roles saves rows with "Simpan … baris", then the
  file they picked is kept, and in the list "Mahasiswa yang ditambahkan"
  the file name under "Diinput" becomes a link.
- When they press that link, then the original file downloads, unchanged.
- When a role without the right to put in students asks for that file,
  even with the exact link, then the server refuses it. Confirmed by a
  check.
- When a file link is copied and opened later by someone who is not
  signed in, then it does not open. Files are never public; every
  download goes through the server. Confirmed by a check.
- When someone picks a file that is not CSV or is larger than 1 MB, then
  nothing is kept and the message says what is wrong, as today.
- When a file's content does not match its name (for example a picture
  renamed to .csv), then it is refused the same way. Confirmed by a check.
- When the file storage is set but cannot be reached during a save, then
  no student is saved, and the message says "Berkas tidak dapat disimpan.
  Coba lagi." Confirmed by a check.
- When "Batal" is pressed, or the preview of the file shows skipped rows
  only, then no file is kept.
- When the file storage settings are empty on a preview, then "Simpan …
  baris" saves the students as today, no file is kept, and the file name
  under "Diinput" stays plain text with no link. Confirmed on the preview.
- When the file storage settings are empty on a local computer, then the
  app says which setting is missing, as it does for the database.
- When the preview's settings are filled in, then a PR preview keeps its
  files in its own place, apart from the preview of `main`, and holds
  sample files only. Confirmed by a check of where each kind of preview
  keeps files; tried by the owner after the settings are filled in.
- When a PR deploys and the preview's settings are filled in, then the
  PR previews' own place for files is emptied first, like the PR preview
  database. The same step pointed at the place of `main` refuses and
  removes nothing. Confirmed by a check.
- When a key for the file storage is needed, then it comes from settings
  outside the repo, and the example settings file lists its name only.
  Confirmed by a check.
- When a Pengasuh or Direktur sends a hand-made request for a kept file,
  then the server refuses it. Confirmed by a check.
- When "Simpan … baris" is pressed twice quickly, then the rows and the
  file are kept once. The file and the students are saved together or not
  at all; a kept file always points to an existing batch, enforced by the
  database. Confirmed by a check.
- When the list is opened on a phone, then the file name or link fits
  with no sideways scroll. Confirmed on the preview.
- When the link is pressed for a 1 MB file on a local computer, then the
  download starts within about 2 seconds.

## Not included

- Photos, PDF attachments and showing pictures on screen. They come with
  the first feature that takes them, reusing this.
- Removing kept files. Files stay as long as their record.
- Links that stop working after a while. A download always goes through
  the server, which checks the person each time.
- Virus scanning.
- Opening the account at the preview's file storage service and filling
  in its settings on the hosting. The owner does that; the hosting notes
  say which settings to fill.

## Better than the prototype

- The prototype reads the CSV and forgets it; keeping it lets staff check
  later exactly what was uploaded.
- The prototype trusts the file name; here the content is checked too.

## Decided

The open questions, each with the answer that stands.

1. Keeping the CSV is the way to try file storage. It is small and real.
2. No free service is chosen for the previews in this work. The app talks
   to any service that works like MinIO, through four settings: its
   address, the name of the place for files, and the two keys. The
   hosting notes list them. While they are empty a preview keeps no file.
3. The PR preview files are emptied on each PR deploy, like the PR
   preview database, once the settings are filled in, and only the PR
   previews' own place. The step refuses to empty the place of `main`,
   the same way the database step refuses the database of `main`.
4. `aws4fetch` talks to the file storage: one small library that signs
   each request to MinIO and to services that work like it. No other
   library is added.

## Decided while building

What the spec did not say, decided during the build. A new issue can
change any of these.

1. The four settings are all filled or all empty. When only some are
   filled, the app stops and names the missing one, on a preview too.
   Empty settings turn file keeping off only on a preview; anywhere else
   they are an error, as for the database.
2. On a local computer the two keys are the ones the Docker setup gives
   its own file storage, which only that computer can reach. The example
   settings file points to them without repeating them.
3. MinIO no longer publishes its own Docker images. The local file
   storage runs the same server from the image its community maintains.
4. The start command starts the file storage and makes its place for
   files. The command that fills the database with sample data is
   unchanged.
5. There is one place for files, with a separate part for each kind of
   environment: PR previews, the preview of `main`, a local computer, and
   the campus server. The app picks the part by itself, the same way the
   database step tells a PR deploy from a `main` deploy. A PR deploy
   empties only the part of the PR previews.
6. A file is checked three ways: the end of its name, its size, and
   whether what it holds really is text. The messages for a wrong type
   and for a file that is too large are the ones already shown.
7. A saved file is written to the file storage first. Then the students,
   their batch and the file's record are saved in one go. If that fails,
   the written file is removed again. If the file storage fails first,
   nothing is saved.
8. A batch is one press of "Simpan … baris". Each student saved from a
   file points to its batch, and the kept file points to the same batch.
   Students put in before this work, or with the form, have no batch.
9. A second save of the same rows finds nothing new to save, so it keeps
   no second file.
10. The right to download a kept file is the right to put in students.
    No new permission is added.
11. A download is refused before the file is looked up, so someone
    without the right cannot learn which files exist. A file that does
    not exist answers "not found" with no detail.
12. A downloaded file keeps its original name. The browser is told to
    save it, never to show it, and not to keep a copy.
13. A long file name under "Diinput" wraps onto the next line.
14. A file storage that does not answer within 10 seconds counts as
    unreachable.
15. Until sign-in is built, "not signed in" exists only where "Ganti
    peran" is off. Where it is on, a visitor with no account picked is
    Kepala Unit, as on every other screen, so that visitor can download.
16. When the file storage cannot be reached during a download, the
    person reads "Berkas tidak dapat dibuka. Coba lagi."
17. A file's place in the storage can never be named in a way that steps
    out of its own part; such a name is refused.

## Steps

- [x] 1. Docker runs the file storage locally, the example settings file
  lists its settings, and the app has one shared way to keep and fetch a
  file with a type and size check.
- [x] 2. Opening a file goes through the server, which checks the
  permission of the record it belongs to.
- [x] 3. "Simpan … baris" keeps the uploaded CSV with the saved batch.
- [x] 4. The file name under "Diinput" downloads the original file, and
  stays plain text where no file was kept.
- [x] 5. Previews read the file storage from settings, keep no file while
  they are empty, keep PR previews apart from `main` and empty their
  place on each PR deploy, and the hosting notes say which settings the
  owner fills in.
