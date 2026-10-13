# Hosting

Where the previews of the app run, and how they are set up. The last
part, "The campus server package", says how the app is run on the campus
server. The server itself is not chosen yet.

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

### What a deploy does to its database

`vercel.json` sets the build command: first the database step, then the
file storage step, then the app build. Vercel tells the build which environment it is in, so the step
knows which database it has:

- **A PR deploy** (preview environment) empties `medali-preview`, adds the
  tables of that PR, and fills it with sample data. The PR deployed last
  is the one whose tables are there.
- **A `main` deploy** (production environment) only applies new table
  changes to `medali-main` and keeps its data. The first time, when the
  database is still empty, it also fills it with sample data, once.

Before it changes anything, the step checks that it has the right
database. Each database carries a mark saying which preview it belongs
to, set on its first deploy. A PR deploy refuses a database marked for
`main`, or one with no mark that already holds tables. A `main` deploy
refuses a database marked for PR previews, and refuses to run at all for
a production deploy that does not come from `main`. A production deploy
from the command line names no branch, so it is refused too.

"Ganti peran", the switch between sample accounts, is on in both
previews and in the local dev server, and off everywhere else, the campus
server included. The app also refuses to start with it on unless a
second sign agrees: a preview must really be running on Vercel, and a
local run must use a database on the same computer.

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
- **A `main` deploy** removes nothing.

The step that empties refuses any part other than `pr-previews`, and a
production deploy that does not come from `main` is refused before
anything is touched. While the four settings are empty the step does
nothing and says so in the build log.

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
The package refuses to start while any of the three settings is empty;
"The campus server package" below says how. The address to register at
Google is then the campus server's own link, followed by
`/masuk/google/kembali`.

Signing in, signing out, and every refusal of an address that Google
confirmed adds a line to a sign-in log in the database, with the time and
the result. A refused line holds no address and no account. The lines
cannot be changed or deleted. A sign-in that got no answer from Google
that can be trusted is not written, because anyone could cause one by
hand: the return address opened directly, a cancel at Google, or a code
Google rejects.

## The campus server package

The package is the app, its database and its file storage (MinIO),
started together with one command. It needs only Docker on the server,
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

1. It checks the settings. With a setting empty, with a database
   password that holds anything but letters and digits, with a file
   storage key that is too short, or with a setting that would turn
   "Ganti peran" on elsewhere (`VERCEL_ENV`, `VERCEL`, or `NODE_ENV` set
   to `development`), it stops there and nothing starts.
   The reason, with the name of each setting to fill in, to change or to
   remove and never a value, is shown by:

       docker compose --file compose.campus.yaml logs check

2. It starts the database and the file storage.
3. It applies the table changes that are new. Each one is applied once.
4. It makes the place for files, if it is not there yet.
5. It starts the app, at port 3000 of the server unless `APP_PORT` in the
   settings file names another. The app opens on the sign-in page.

The app run without this check, outside the package, still refuses
empty Google sign-in settings by itself: it writes their names to its
log and answers every address with an error.

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

### Update to a newer version

Bring the copy of the repo on the server up to date, then run the start
command again. It builds the newer version and applies its new table
changes once. The data and the files are kept.

### Stop

    docker compose --file compose.campus.yaml stop

The start command starts it again, with the data and the files as they
were: they are kept in two Docker volumes, `medali-campus_db-data` and
`medali-campus_files-data`. Never add `--volumes` to a `down` command:
it removes both, and there is no backup yet.

### What can be reached

Only the app listens on the network. The database and the file storage
have no port on the server; only the app reaches them, inside the
package.

Nobody can sign in until the app is opened over HTTPS: the browser keeps
the sign-in cookies only on a secure connection. So the server needs a
web certificate in front of the app, which is set up apart from this
package. Once it is there, people use that secure address, and the
app's own port should no longer be open to them directly.

### Trying it on a local computer

The same steps work on a local computer with made-up values in
`.env.campus`. `pnpm campus:start` and `pnpm campus:stop` run the start
and the stop command. Google sign-in needs real keys, so the trial ends
at the sign-in page.
