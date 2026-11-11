# One fixed preview on Render

## What we want

A second copy of the app on Render, "medali-preview", with its own small
database and sample data only. It shows one PR at a time: the PR pushed
last. It needs no Pro plan, and it never touches `medali.site` or its
data.

## Who it is for

The owner, who tries PRs. Everyone, through the sample accounts on "Ganti
peran".

## What should happen

- When a commit is pushed to an open PR, then the preview is built from
  that PR's branch, at the same preview link as before.
- When the preview deploys, then its database is emptied, gets that PR's
  tables, and is filled with sample data, and "Ganti peran" works.
- When two PRs are pushed one after the other, then the preview shows the
  one pushed last. The owner can bring the other one back by running
  "Pratinjau Render" on GitHub with its PR number.
- When nobody has opened the preview for a while, then it sleeps, and
  wakes within about a minute on the next visit.
- When `medali.site` starts, then it is still in real-data mode, with no
  "Ganti peran" and no sample data, exactly as now.
- When the preview's settings would point at the database of
  `medali.site`, then it refuses to start, and the log says why.
- When the preview has no file storage, then uploads keep no file, as the
  previews already do without one.
- The hosting doc says how the owner makes the preview in the Render
  dashboard, makes a Render key and puts it in GitHub as a secret, and
  what the preview costs.

## Not included

- A preview per PR: that needs the Pro plan.
- File storage for the preview.
- Removing the Vercel and Neon setup.

## Sizes

- The preview app: Render's free size, which sleeps when nobody visits.
- The preview database: the smallest paid size, the same as the database
  of `medali.site`, so it is not removed after a while.

## Open questions

None.

## Steps

- [x] 1. The app knows it runs as the Render preview, and only then runs in
  sample mode with "Ganti peran".
- [x] 2. A deploy of the preview starts its database over with the sample
  data, and refuses the database of `medali.site`.
- [x] 3. The Render setup gets the preview app and its database.
- [x] 4. A GitHub step points the preview at the PR pushed last, or at a PR
  chosen by number.
- [x] 5. The hosting doc and the repo rules say where previews run now.
