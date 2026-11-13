# Hosting

Where the previews of the app run, and how they are set up. "Render"
says how the app runs at Render, at `medali.site`, and how the one
preview at Render shows the PR pushed last. The last part, "The
campus server package", says how the app is run on the campus server.
The server itself is not chosen yet.

## What the hosting is

- The app runs on Vercel, on the free Hobby plan, in a project named
  `medali`.
- The project is connected to the GitHub repo `zakiarsyad/medali`.
  Vercel builds the app by itself after every push.
- Previews hold sample data only.

## Which link is which

- **Preview of `main`:** one fixed link that always shows the latest
  `main`. Vercel calls it the production link. It is on the project's page
  in Vercel, and on the repo's page on GitHub under "Deployments".
- **Preview of a PR:** each PR gets its own link, rebuilt on every push.
  Vercel posts it on the PR page.
- Anyone with a link can open it. No sign-in to Vercel is needed.

## Set in the repo

The file `vercel.json` holds:

- The region where the app runs: Singapore (`sin1`).
- The branch `proof-pictures` is never built. It holds only pictures.

The file `package.json` holds:

- The Node.js version Vercel builds and runs with: 24. Vercel takes the
  newest release of that version.
- The pnpm version, in `packageManager`: it is used on a local computer
  and in the GitHub checks. Vercel picks pnpm 9 or 10 from the lock file,
  `pnpm-lock.yaml`: 10 for a new project. The build log shows which.

## Set only in the Vercel dashboard

Someone recreating the project sets these by hand:

- Plan: Hobby.
- Git: connected to the GitHub repo, with `main` as the production branch.
- Framework preset: Next.js, with its default build settings.
- Deployment protection: off, so that anyone can open a preview.
- Ignored build step: skips the `proof-pictures` branch.

## Databases

Two Neon databases exist, added through Vercel.

- `medali-main`: tied to the production environment, for the preview of
  `main`.
- `medali-preview`: tied to the preview environment, shared by all PR
  previews.

Their keys are kept by Vercel. They are never written in the repo.

Vercel runs many short-lived copies of the app at once, so on both
previews the app reaches its database through Neon's shared-connection
address: the database's own address with `-pooler` added to its first
part, unless the key Vercel gives is that address already. Each copy
keeps one connection and closes it once it has been idle for 10
seconds. The build step that changes the tables uses the key as Vercel
gives it. The campus server runs one copy all the time and keeps up to
ten connections, open while idle.

### What a deploy does to its database

`vercel.json` sets the build command: first the database step, then the
file storage step, then the app build. Vercel tells the build which environment it is in, so the step
knows which database it has:

- **A PR deploy** (preview environment) empties `medali-preview`, adds the
  tables of that PR, and fills it with sample data. The PR deployed last
  is the one whose tables are there.
- **A `main` deploy** (production environment) starts `medali-main` over
  when it brings a table change that the database does not have yet: it
  empties the database, makes every table again, and fills it with the
  sample data of that `main`. A feature brings its sample data together
  with its tables, so this is how the sample data of merged work gets
  there. Whatever was added by hand on the preview of `main` is lost
  then. A deploy with no new table change keeps the data as it is.

A `main` deploy also starts the database over when it holds no account,
which is the case the first time and after a start that failed half way.
A start that finished leaves a mark in the database, and the marks of
earlier starts are removed before a new start begins. So a database has
no mark when it was filled before this mark existed, or when its last
start failed before it finished. A `main` deploy starts such a database
over, also with no new table change.

The build log says which happened in one line: "Database of main started
over with sample data", with the reason, or "No table change is new;
data kept."

Before it changes anything, the step checks that it has the right
database. Each database carries a mark saying which preview it belongs
to, set on its first deploy. Either deploy refuses a database with no
mark that already holds tables. A PR deploy refuses a database marked
for `main`. A `main` deploy refuses a database marked for PR previews,
and refuses to run at all for a production deploy that does not come
from `main`. A production deploy from the command line names no branch,
so it is refused too. Both refuse a database marked for the campus
server.

"Ganti peran", the switch between sample accounts, is on in both
previews, in the preview at Render and in the local dev server, and off
everywhere else, the campus server and `medali.site` included. The app
also refuses to start with it on unless a second sign agrees: a preview
at Vercel must really be running on Vercel, the preview at Render must be
the app Render names `medali-preview`, and a local run must use a
database on the same computer.

### Set only in the Vercel and Neon dashboards

Someone recreating the project, or checking it, makes sure that:

- Each database gives the app its key under the name `DATABASE_URL`:
  `medali-main` in the production environment only, and `medali-preview`
  in the preview environment only. The key must be there at build time
  too, which is the default.
- The Neon integration does not make a new database branch for each
  preview deploy. All PR previews share `medali-preview`.
- The project has no build command set in the dashboard that overrides
  `vercel.json`.

## File storage

The previews keep uploaded files at a service that works like MinIO. No
service is chosen yet. Until the owner opens an account at one and fills
in the settings below, a preview keeps no file: students from a file are
saved as before, and the file name under "Diinput" stays plain text.

### Set only in the Vercel dashboard

Four settings, under the project's environment variables. They must be
there at build time too, which is the default.

- `FILE_STORAGE_URL`: the address of the service.
- `FILE_STORAGE_BUCKET`: the name of the place for files there. It is made
  by hand at the service, once; the app does not make it.
- `FILE_STORAGE_ACCESS_KEY` and `FILE_STORAGE_SECRET_KEY`: the two keys of
  an account that may read, write, list and remove files in that place.

Fill them in for the preview environment and for the production
environment. Both may hold the same four values: the app keeps each
kind of preview in its own part of the place. The keys are kept by
Vercel. They are never written in the repo.

All four are filled, or all four are left empty. With only some filled,
the build stops and names the missing one.

### Where each preview keeps its files

- **PR previews** keep theirs in the part named `pr-previews`, shared by
  all PR previews, like their database.
- **The preview of `main`** keeps its in the part named `main-preview`.

The app picks the part from the environment Vercel says it is in, the
same way the database step does. A preview cannot read or remove a file
of the other part.

### What a deploy does to the files

- **A PR deploy** removes every file in `pr-previews`, right after it
  has started the PR preview database over. Sample files only are ever
  there.
- **A `main` deploy** removes every file in `main-preview` once after
  each time its database was started over, so no file is left without
  its row. The mark of the start says whether its files were removed
  yet: if the step fails, the next `main` deploy removes them. Until
  then the app from before stays live on the new database, and a file
  uploaded in that time is removed with the rest while its row is kept,
  which is accepted because the preview holds sample data only. A `main`
  deploy that follows no start removes nothing. The build log says
  "Files of main emptied", with how many, or "Files of main kept."

The step that empties refuses any part other than `pr-previews` and
`main-preview`, so never the part of the campus server, and a
production deploy that does not come from `main` is refused before
anything is touched. While the four settings are empty the step does
nothing and says so in the build log; the files of `main-preview` are
then removed once by the first `main` deploy after they are filled in.

After that, the same step gives the sample attendance its photos: every
attendance that has a time sent and no photo gets a copy of one drawn
picture with no person in it. A deploy that kept its data finds none
left without. It then gives the sample clarifications their papers the
same way: every clarification without a file gets a copy of one drawn
paper that names no person. The build log says "Sample attendance photos
added", with how many, and then "Sample clarification papers added",
with how many. While the four settings are empty no photo and no paper
is kept: the cards of "Verifikasi presensi" say "Foto tidak tersimpan di
sini.", and a clarification names no file to open, neither on its card
in "Klarifikasi kehadiran" nor in the student's "Riwayat kehadiran". The
first deploy after the settings are filled in adds the photos and the
papers. On a local computer `pnpm files:setup` does the same, after
`pnpm db:setup`.

## Google sign-in

People sign in with their Google account, and only campus addresses are
let in. The owner makes the keys at Google and fills in the settings
below. Until then nobody can sign in with Google, and the previews are
used with "Ganti peran" as before.

### Set only in the Vercel dashboard

Three settings, under the project's environment variables:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: the two keys Google gives
  for the app, from a "web application" client in the Google Cloud
  console.
- `CAMPUS_EMAIL_ENDING`: the ending of a campus email address, from the
  "@" on. Only an address that ends with exactly this may sign in, and
  only from a Google account that the campus itself runs at Google: a
  personal Google account made with a campus address is refused.

Fill them in for the production environment only, which is the preview of
`main`. A PR preview gets a new link with every PR, and Google sends a
person back only to a link it was told about, so Google sign-in cannot
work there. The keys are kept by Vercel. They are never written in the
repo.

All three are filled, or all three are left empty.

### Set at Google

The client at Google must hold the address Google sends a person back
to, under "Authorized redirect URIs": the link of the preview of `main`,
followed by `/masuk/google/kembali`. The app builds this address from the
link it was opened at, so the preview must be opened at the same link
that is registered.

Google's Branding page asks for a privacy policy link before the app can
leave "Testing". It is the app's link followed by `/privasi`: the public
"Kebijakan privasi" page, which opens without sign-in.

### While the settings are empty

- The sign-in page, at `/masuk`, still opens. Pressing "Masuk dengan
  Google" says "Masuk dengan Google belum diatur." and nothing else
  happens. The same goes while only some of the three are filled.
- "Ganti peran" works as before, on both previews and on a local
  computer.
- Pengguna dan peran accepts any well-formed email. Once
  `CAMPUS_EMAIL_ENDING` is filled, a new account's email must end with it.
  The same goes for a student's "Email kampus" on Pengguna baru
  mahasiswa.

### On the campus server

There is no "Ganti peran" there, so Google sign-in is the only way in.
The package still starts while the three settings are empty: the
sign-in page opens, and "Masuk dengan Google" says "Masuk dengan Google
belum diatur.", so nobody can sign in yet. The address to register at
Google is the campus server's own link, followed by
`/masuk/google/kembali`.

Signing in, signing out, and every refusal of an address that Google
confirmed adds a line to a sign-in log in the database, with the time and
the result. A refused line holds no address and no account. The lines
cannot be changed or deleted. A sign-in that got no answer from Google
that can be trusted is not written, because anyone could cause one by
hand: the return address opened directly, a cancel at Google, or a code
Google rejects.

## Kontak konseling kampus

`CAMPUS_COUNSELLING_CONTACT` is how a student reaches the campus
counsellors, such as a phone number or a room. Profil saya shows it under
the line that says where to get help. It is optional and empty at the
start: while it is empty, nothing more shows. It is set in the Vercel
dashboard for a preview, and in the settings file of the package on the
campus server.

## Render

The app also runs at Render, in Singapore, at `medali.site`. It is the
campus server package's app, so it runs in real-data mode: there is no
"Ganti peran" and no sample data. It starts with an empty database.
Vercel keeps the previews as before. Render also runs one preview of its
own, described in "The preview at Render" below.

### The three parts

The file `render.yaml` describes them, and Render makes all three from
it, beside the two parts of the preview:

- `medali`: the app. It is built from `main` of the GitHub repo
  `PojokAsrama/medali`, and built again on every merge to `main`. On
  each start it checks its settings, applies the new table changes once,
  and makes the place for files if it is not there yet, as the package
  does; the log says each. It is the only part that can be reached from
  the internet.
- `medali-db`: the database, Postgres 17, with 1 GB of storage. Only the
  app reaches it; nothing on the internet may connect to it.
- `medali-files`: the file storage, the same as in the package, with a
  1 GB disk that keeps the files when it starts again. Only the app
  reaches it, inside Render.

The database's storage and the file storage's disk can be made larger
later on their pages at Render, but never smaller.

Render makes the database's password and the file storage's secret key,
and gives them to the app. No key or password is written in the repo.

### Making the setup

1. Make sure Render's GitHub app may read the repo `PojokAsrama/medali`.
2. In the Render dashboard, choose "New", then "Blueprint", and pick the
   repo `PojokAsrama/medali`.
3. Render asks for the settings marked to fill in by hand:
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CAMPUS_EMAIL_ENDING` and
   `CAMPUS_COUNSELLING_CONTACT`. Leave each one empty while it is not
   known yet. If Render does not accept an empty one, remove that setting
   from the form; it can be added later on the app's page. Render asks
   only this first time; later they are changed on the app's page.
4. Render makes the three parts and builds the app. Once the deploy is
   done, the app's Render link, ending in `onrender.com`, opens "Masuk".
   If the first deploy fails because the database or the file storage
   was not ready yet, choose "Manual Deploy" on the app's page.

Nobody can sign in yet: Google sign-in needs its three settings filled,
and the address `https://medali.site/masuk/google/kembali` registered at
Google, as in "Google sign-in" above. Signing in with an email and a
password does not exist yet.

### The domain

`medali.site` is registered at Rumahweb, and its records are kept at
Cloudflare. Do these steps by hand, in this order:

1. At Rumahweb, set the nameservers of `medali.site` to the two that
   Cloudflare gives for it.
2. At Cloudflare, under "SSL/TLS", set the mode to "Full".
3. At Cloudflare, remove any `AAAA` record of the domain: Render does
   not answer at those addresses.
4. At Cloudflare, under "DNS", add a `CNAME` record named `@` that points
   to the app's Render link, such as `medali.onrender.com`, with "Proxy
   status" set to "DNS only".
5. Wait until the app's page at Render shows the certificate of
   `medali.site` as valid. Render makes the certificate. After that the
   record may be set to "Proxied".

The Render link keeps working beside `medali.site`. Render also lists
`www.medali.site` by itself; it stays unverified, because it has no
record at Cloudflare.

### The preview at Render

One more copy of the app, with sample data only. It shows one PR at a
time: the PR pushed last. It never touches `medali.site` or its data.
`render.yaml` describes its two parts:

- `medali-preview`: the app, at its own Render link, ending in
  `onrender.com`. It has no domain and no file storage: uploads keep no
  file, as on a preview at Vercel without file storage. It never
  deploys by itself, not even from `main`.
- `medali-preview-db`: its own database, which only the preview app
  reaches; nothing on the internet may connect to it.

The app knows it is the preview from two signs: the setting
`MEDALI_RENDER_PREVIEW`, which `render.yaml` gives this app only, and
the name Render gives the app, `medali-preview`. Only with both does it
run with sample data and "Ganti peran". The app of `medali.site` is
built with the campus mark, which wins over both.

#### Which PR it shows

The GitHub step "Pratinjau Render" has Render build a PR's last commit
on the preview:

- by itself, each time a PR to `main` is opened, reopened or gets a new
  push. The push made last wins. A PR from a fork is skipped.
- by hand, from the "Actions" tab on GitHub: choose "Pratinjau Render",
  then "Run workflow", and fill in the PR's number. This brings back a
  PR after another one was pushed. The PR must be open.

It does so through the preview's deploy hook: a secret address that can
only start a deploy of the preview, and change nothing else at Render.
The step always runs as it is on `main`, so a PR cannot change it. While
the hook's GitHub secret is missing, the step says so and does nothing;
it does not fail.

The preview's own branch at Render stays `main`. A deploy that Render
starts by itself, such as after a "Manual Sync" of the Blueprint, shows
`main` until the next push to a PR or a run of "Pratinjau Render" by
hand.

#### What a deploy does to its database

The app starts its database over each time it starts with a commit it
did not start with before: it empties the database, adds the tables of
that PR, fills it with sample data, and only then opens. The log says
"Render preview database started over with sample data", with the
commit.

When nobody has opened the preview for about 15 minutes, Render puts it
to sleep. The next visit wakes it, which takes about a minute. Waking
starts the app again with the same commit, so the data is kept, and the
log says "data kept". Running "Pratinjau Render" for the PR that is
already shown, with no new push, keeps the data too.

Before it changes anything, the start checks the database's mark, as a
deploy at Vercel does: the database is marked as a PR preview one on
its first start. It refuses a database marked for the campus server,
which the database of `medali.site` is, and one with no mark that
already holds tables. The app then does not start, and the log says why.

#### Making the preview

Do these steps by hand, once, after this setup is merged to `main`:

1. In the Render dashboard, open the Blueprint of `PojokAsrama/medali`.
   If it does not list `medali-preview` and `medali-preview-db` yet,
   choose "Manual Sync". Render makes both, builds the preview from
   `main`, and starts it.
2. On the page of `medali-preview`, open "Settings", find "Deploy
   Hook", and copy its address. Anyone who has it can start a deploy of
   the preview, and nothing else, so it goes only into GitHub's secrets.
   If it ever leaks, choose "Regenerate Hook" there and put the new one
   in GitHub.
3. On GitHub, in the repo's "Settings", then "Secrets and variables",
   then "Actions", add a repository secret named
   `RENDER_PREVIEW_DEPLOY_HOOK`, holding the address.

From the next push to a PR on, the preview shows that PR.

#### What it costs

- The app: Render's free size, which costs nothing. It sleeps when nobody
  visits.
- The database: the same smallest paid size as the database of
  `medali.site`, with 1 GB of storage, so Render does not remove it
  after a while. It costs as much as that one; Render's price page says
  how much.

## The campus server package

The package is the app, its database, its file storage (MinIO) and the
part that makes and restores backups, started together with one command.
It needs only Docker on the server,
with its Compose plugin: the `docker compose` command. It was tried with
Docker Compose 5.1.2 only, so use that version or a newer one. It holds
no key, no password and no sample data.

The package carries a mark, `MEDALI_CAMPUS`, built into it. With the
mark the app is on the campus server whatever the other settings say:
there is no "Ganti peran", and the sample data command is refused. The
sample data and the commands that load it are not in the package at all.
On its first start the package also marks its database as the campus
one, as the preview databases are marked, so the sample data command
refuses that database from any computer.

### The settings file

Put a copy of the repo on the server. Copy `.env.campus.example` to
`.env.campus` beside it and fill in each value; the example says what
each one is. The file stays on the server and is never committed.

### Start

    docker compose --file compose.campus.yaml --env-file .env.campus up --build --detach --wait

While `.env.campus` is not there, Docker Compose itself stops with
"couldn't find env file" and nothing starts.

On every start the package does, in this order:

1. It checks the settings. With the database password or a file storage
   key empty, with a database password that holds anything but letters
   and digits, with a file storage key that is too short, or with a
   setting that would turn "Ganti peran" on elsewhere (`VERCEL_ENV`,
   `VERCEL`, or `NODE_ENV` set to `development`), it stops there and
   nothing starts.
   The reason, with the name of each setting to fill in, to change or to
   remove and never a value, is shown by:

       docker compose --file compose.campus.yaml logs check

2. It starts the database and the file storage.
3. It applies the table changes that are new. Each one is applied once.
4. It makes the place for files, if it is not there yet.
5. It starts the app, at port 3000 of the server unless `APP_PORT` in the
   settings file names another. The app opens on the sign-in page.

### The first account

The package starts with no account. One command makes the first Kepala
Unit account, who then adds everyone else in Pengguna dan peran:

    docker compose --file compose.campus.yaml exec app pnpm --silent account:first "Nama Lengkap" nama@kampus.example

It adds a line to the log of role changes. It refuses, and says why in
one line, once a Kepala Unit account that is not removed exists, or when
the address does not end with `CAMPUS_EMAIL_ENDING`. It never prints the
name or the address back. For the same reason a fault of the database is
shown by its code only: check that the package is started, then run the
command again. If it fails again, report the code.

### A new Kepala Unit when the old one is gone

Kepala Unit hands the role over in the app, with "Jadikan Kepala Unit"
in Pengguna dan peran. When the Kepala Unit in office is gone and cannot
do that, one command makes another person the Kepala Unit:

    docker compose --file compose.campus.yaml exec app pnpm --silent account:head-of-unit "Nama Lengkap" nama@kampus.example

The account with that address becomes Kepala Unit and keeps its other
roles; when no account that is not removed has the address, it is made.
Every other Kepala Unit stops being one and keeps its other roles; one
left with no role is removed, as "Hapus" does. Each change adds a line
to the log of role changes, naming the new Kepala Unit as who changed
it. The command refuses, and says why in one line, an address that does
not end with `CAMPUS_EMAIL_ENDING` or that belongs to a student account.
Like the first-account command, it never prints the name or the address
back, and shows a fault of the database by its code only.

### Update to a newer version

Bring the copy of the repo on the server up to date, then run the start
command again. It builds the newer version and applies its new table
changes once. The data and the files are kept.

### Stop

    docker compose --file compose.campus.yaml stop

The start command starts it again, with the data and the files as they
were: they are kept in two Docker volumes, `medali-campus_db-data` and
`medali-campus_files-data`. Never add `--volumes` to a `down` command:
it removes both, and then only a backup brings the data back; "Backups"
below says how.

### What can be reached

Only the app listens on the network. The database, the file storage and
the backup part have no port on the server; they are reached only inside
the package.

Nobody can sign in until the app is opened over HTTPS: the browser keeps
the sign-in cookies only on a secure connection. So the server needs a
web certificate in front of the app, which is set up apart from this
package. Once it is there, people use that secure address, and the
app's own port should no longer be open to them directly.

### Backups

A backup is one file that holds the whole database and every uploaded
file, as they were at one moment. It is locked with a password and
cannot be read without it. Its name is the day and the time it was made,
in campus time, such as `2026-10-13-020000.medali-backup`.

#### The settings

Four settings in `.env.campus`. After changing one, run the start
command again.

- `BACKUP_FOLDER`: the folder on the server where backups are kept, as a
  full path. Point it at another disk or server than the one the app
  runs on: a backup kept beside the data is lost together with it.
  While it is empty no backup is made. With a bare name, without a path,
  the package does not start: Docker Compose takes such a name for
  something else. If the folder does not exist, Docker makes it, so
  check that the other disk is really attached there, or the backups
  land on the app's own disk.
- `BACKUP_PASSWORD`: the password every backup is locked with. Keep a
  copy somewhere safe apart from the server. It cannot be recovered, and
  without it no backup can be read. A backup opens only with the
  password that was set when it was made. Letters, digits and spaces
  only is safest: other signs, such as `$`, `#` or quotes, can be
  changed when the settings file is read, and the copy kept elsewhere
  would then not open the backup.
- `BACKUP_HOUR`: the hour of the nightly backup, in campus time, such as
  `02:00`. Empty means 02:00.
- `BACKUP_KEEP`: how many backups are kept. Empty means 14.

Both commands below refuse, and name the setting, while the folder or
the password is empty, or while the hour or the number cannot be read.

#### Making a backup

    docker compose --file compose.campus.yaml exec backup backup

It says the name and the size of the backup it made. People can go on
using the app meanwhile. A backup that fails leaves nothing behind in
the folder, and says what to check. A backup belongs to the server's
administrator account (root), and only that account can read it.

#### The nightly backup

Once `BACKUP_FOLDER` is filled in, a backup is made every night at the
hour of the settings. Each night's result, the name and size or the
reason it failed, is read with:

    docker compose --file compose.campus.yaml logs backup

Look there now and then: a nightly backup that fails tells nobody else.
While `BACKUP_FOLDER` is empty, that log says "Cadangan otomatis belum
diatur." and no nightly backup runs.

#### How many are kept

After each new backup, the oldest are removed until the number to keep
is left. Nothing is removed when a backup fails. Only files with a
backup's name are counted and removed; any other file in the folder is
left alone.

#### Restoring into an empty package

1. Start the package, with `BACKUP_PASSWORD` set to the password the
   backup was made with, and the backup in the backup folder.
2. Restore it, by its name:

       docker compose --file compose.campus.yaml exec backup restore 2026-10-13-020000.medali-backup

3. Start the app again, which also applies the table changes a newer
   version of the package still needs:

       docker compose --file compose.campus.yaml restart app

The database and the files are then as they were when the backup was
made, and the same accounts sign in. Only the backup password must be
the same as before; the other settings may differ.

#### Restoring into a package that holds data

A package that has at least one account holds data, and the restore
command refuses it and changes nothing. To replace everything it holds
with the backup, add the word `GANTI-SEMUA` after the name:

    docker compose --file compose.campus.yaml exec backup restore 2026-10-13-020000.medali-backup GANTI-SEMUA

It then asks to type `GANTI-SEMUA` once more. With any other answer it
changes nothing. With the word, everything entered after the backup was
made is gone. Then start the app again, as in step 3 above.

Do it when nobody is working in the app: what people save while it runs
is lost, and pages may fail until the app is started again.

#### What the restore refuses

- A wrong password: it says the backup does not open with
  `BACKUP_PASSWORD`.
- A backup that is broken or cut short, for example by a copy that did
  not finish: it says so. Use another backup.

In both cases nothing in the package is changed. A restore that fails
later, half way, also leaves the database exactly as it was; files it
had already added may stay as extra files, which harms nothing.

One backup or restore runs at a time. A second one started meanwhile
refuses.

#### Trying a restore on another computer

Do this before real data goes in, and again from time to time: a backup
that was never restored is not known to work.

1. Put a copy of the repo on the other computer, with Docker.
2. Make its `.env.campus`, with the same `BACKUP_PASSWORD` as on the
   server. The other values may be made up.
3. Make a folder, put a copy of one backup in it, and set
   `BACKUP_FOLDER` to that folder.
4. Fetch the newest tools first, so they are not older than the ones
   that made the backup:

       docker compose --file compose.campus.yaml --env-file .env.campus build --pull backup

5. Start the package, restore the backup, and start the app again, as
   in "Restoring into an empty package".
6. Open the app and check that the sign-in page opens. Signing in with
   Google needs the real keys, and this computer's address registered
   at Google, so the trial ends at the sign-in page unless both are
   there.

#### Room on the server

While a backup or a restore runs, the server needs free room of about
the size of the database and the files together, for a working copy
that is removed when the command ends. That is besides the room the
backups themselves take in the backup folder.

### Trying it on a local computer

The same steps work on a local computer with made-up values in
`.env.campus`. `pnpm campus:start` and `pnpm campus:stop` run the start
and the stop command. Google sign-in needs real keys, so the trial ends
at the sign-in page.
