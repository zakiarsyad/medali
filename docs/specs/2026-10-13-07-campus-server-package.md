# Campus server package

Group: Groundwork

## What we want

The app is packaged so the campus server can run it: the app, the
database and MinIO, started with one command. The package carries a firm
mark that says "this is the campus server". With that mark, Ganti peran
and the sample data command can never be turned on, whatever the other
settings say. Because the package starts empty, one command makes the
first Kepala Unit account, who then adds everyone else.

## Who it is for

The campus IT staff who will run the server, and the owner, who tries the
package on a local computer first.

## What should happen

A preview cannot run the package, so every case here is confirmed on a
local computer or by a check (see decision 2). The local trial uses
made-up values for the Google keys and the campus address ending; no
case needs a real Google sign-in.

- When someone runs the package's start command on a computer with
  Docker, then the app, the database and MinIO start, the table changes
  are applied, and the app opens on the sign-in page.
- When the app runs from the package, then there is no Ganti peran and no
  way to reach it, even by typing its address.
- When the package is started with the Ganti peran setting turned on,
  then it refuses to start, and says which setting to remove.
- When the package is started with settings that look like a preview or a
  local run, then the campus mark still wins: Ganti peran stays off.
  Confirmed by a check.
- When someone runs the sample data command against the package's
  database, then it refuses and changes nothing.
- When someone runs the first-account command with a name and a campus
  address, and no Kepala Unit account exists, then one account with the
  role Kepala Unit is made, and a line goes to the log of role changes.
- When that command is run again while a Kepala Unit account exists, or
  with an address that does not end with the campus address ending, then
  it refuses, says why, and changes nothing. Confirmed by a check.
- When a required setting is missing (database, file storage, Google
  keys, campus address ending), then the app refuses to start and names
  the missing setting, without showing any key.
- When the package is stopped and started again, then the data and the
  files are still there.
- When a newer version of the package is started, then new table changes
  are applied once and the data is kept.
- When the database or MinIO is reachable from outside the server, then
  that is a mistake: by default only the app listens on the network.
  Confirmed by a check.
- When the package is built, then it holds no key, no password and no
  sample data. Confirmed by a check.
- When the app starts from the package on a local computer, then the
  sign-in page shows within about 1 second.
- When the sign-in page from the package is opened at a phone's width,
  then it fits with no sideways scroll, as on the previews.

## Not included

- Choosing and setting up the real campus server, its address and its
  web certificate.
- Backups and restore. They need their own spec once the server is known.
- Moving real data in.
- A real Google sign-in on the package. It needs the real keys, which the
  owner sets on the server.

## Better than the prototype

- The prototype has no server at all; the refusal to start with unsafe
  settings protects real data from a wrong setting.

## Decided

The open questions, each with the answer that stands.

1. The package assumes only Docker. Nothing else is needed on the server.
2. Trying the package on a local computer is enough as proof. The guide
   can be followed there, and the preview only shows nothing else
   changed.
3. Backups are not part of this spec. They get their own spec, before any
   real data goes in.
4. A one-time command, run on the server at set-up, makes the first
   Kepala Unit account from a name and a campus address. It works only
   while no Kepala Unit account exists.

## Decided while building

What the spec did not say, decided during the build. A new issue can
change any of these.

1. The campus mark is a setting written into the package itself when it
   is built, not into the settings file on the server. Where the mark is
   there, the app is on the campus server, before any other setting is
   looked at. The mark counts whatever value it holds, so it cannot be
   switched off by giving it another value.
2. The app has no single Ganti peran switch: Ganti peran follows from
   where the app says it runs. So "the Ganti peran setting turned on"
   means any setting that would turn it on elsewhere: one that says the
   app is a preview, one that says it runs at the previews' hosting, or
   one that says it is a local run. The package refuses to start with any
   of them, and names each one to remove.
3. Refusing to start here means the package really stops: the check runs
   before the database and MinIO start, and nothing is served. The app
   also keeps its own check from Google sign-in.
4. On start the package does, in this order: the check of the settings,
   the table changes, the place for files in MinIO if it is missing, then
   the app.
5. Every missing setting is named at once, not only the first.
6. The settings file on the server holds the database password, the two
   file storage keys, the two Google keys and the campus address ending.
   The addresses of the database and the file storage are fixed inside
   the package. The two file storage keys are also the keys MinIO itself
   is started with.
7. The sample data and the commands that load it are left out of the
   package, so the sample data command cannot run there at all. The
   package's database is also marked as the campus one on its first
   start, in the same way the preview databases are marked, and the
   sample data command refuses a database with that mark from anywhere.
   A database marked as a preview one is refused by the package.
8. A Kepala Unit account exists when an account that is not removed holds
   the role. A removed one does not count.
9. The first account is logged as added by itself, as the sample Kepala
   Unit is: nobody else exists yet to name.
10. The first-account command also refuses a missing or malformed name or
    address, an empty campus address ending, and an address another
    account already uses.
11. The app is reached at one port of the server, 3000 unless the
    settings file names another.

## Steps

- [x] 1. The app is packaged as one image, with the campus mark built in.
- [x] 2. One command starts the app, the database and MinIO together,
  with only the app reachable and data kept between restarts.
- [ ] 3. With the campus mark, Ganti peran and the sample data command
  refuse to run, and missing settings stop the start with a clear
  message.
- [ ] 4. The first-account command makes the first Kepala Unit account,
  once.
- [ ] 5. Table changes are applied on start; a short guide in the existing
  hosting notes says how to start, make the first account, update and
  stop the package.
