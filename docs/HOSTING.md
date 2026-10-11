# Hosting

Where the previews of the app run, and how they are set up. The campus
server is not covered here; it is not set up yet.

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
app build. Vercel tells the build which environment it is in, so the step
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
