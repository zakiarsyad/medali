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

Two Neon databases exist, added through Vercel. Nothing uses them yet. The
work that adds the data model brings them in.

- `medali-main`: tied to the production environment, for the preview of
  `main`.
- `medali-preview`: tied to the preview environment, shared by all PR
  previews.

Their keys are kept by Vercel. They are never written in the repo.
