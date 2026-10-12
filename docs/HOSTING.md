# Hosting

Where the previews of the app run, and how they are set up. The campus
server is not set up yet; it is covered here only where a part names it.

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

### On the campus server

There is no "Ganti peran" there, so Google sign-in is the only way in.
The app refuses to start while any of the three settings is empty: it
writes the names of the empty ones to its log, without showing a value,
and answers every address with an error instead of the app. The program
itself keeps running, as with the "Ganti peran" check above. The address
to register at Google is then the campus server's own link, followed by
`/masuk/google/kembali`.

Signing in, signing out, and every refusal of an address that Google
confirmed adds a line to a sign-in log in the database, with the time and
the result. A refused line holds no address and no account. The lines
cannot be changed or deleted. A sign-in that got no answer from Google
that can be trusted is not written, because anyone could cause one by
hand: the return address opened directly, a cancel at Google, or a code
Google rejects.
