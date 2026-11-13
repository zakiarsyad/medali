# Deploy to Render with an empty database

Group: Groundwork
Kind: chore

## What we want

The app runs on Render, in Singapore, at `medali.site`, built from `main`
of the GitHub repo `PojokAsrama/medali` and built again on every merge to
`main`. The setup is written in the repo, so Render makes all of it from
there in one go: the app, its own database and its own file storage. It
starts empty, with no sample data, in the same real-data mode as the
campus server: no "Ganti peran" and no sample data command.

## Who it is for

The owner, who sets it up. Everyone, once signing in with email and
password is there.

## What should happen

1. When the owner makes the setup from the repo in the Render dashboard,
   then Render makes three parts in Singapore: the app (`medali`), the
   database (`medali-db`, Postgres 17) and the file storage
   (`medali-files`, with a 5 GB disk). Render makes every key and
   password; none is written in the repo.
2. When a deploy is done, then the app's Render link opens "Masuk" over
   HTTPS.
3. When the app starts the first time, then the database is marked as the
   real-data one, every table is made with no rows in it, and the place
   for files is made. The log says so.
4. When the Google settings are empty, then the app still starts, and
   pressing "Masuk dengan Google" says "Masuk dengan Google belum
   diatur." as it does now.
5. When a newer version is merged to `main`, then Render builds it,
   applies only the new table changes, and keeps the data and the files.
6. When the file storage starts again, then the files uploaded before are
   still there.
7. Only the app can be reached from the internet. The database and the
   file storage are reached only by the app.
8. When the domain's records at Cloudflare point to the app, then the app
   opens at `medali.site` over HTTPS, with a certificate made by Render.
   The Render link keeps working beside it.
9. The hosting doc says how to make the setup on Render, and the steps
   done by hand, in order: at Rumahweb, set the domain's nameservers to
   the two Cloudflare gives; at Cloudflare, set "SSL/TLS" to "Full"; add a
   record named `@` that points to the app's Render link, as "DNS only";
   once Render shows the certificate as valid, it may be set to
   "Proxied".

## Not included

- Signing in with email and password, and the "admin" account: the next
  spec. Until then nobody can sign in on Render.
- Uploading users and other data from CSV files.
- Nightly backups.
- `www.medali.site`.
- Leaving Vercel: it keeps the previews of PRs and of `main`.

## Open questions

None.

## Steps

- [x] 1. The server package starts while the Google settings are empty.
- [x] 2. The app reaches the file storage at its private address on Render.
- [x] 3. A Render setup file for the app, the database and the file storage,
  with the domain `medali.site` and the sizes: app `0.5c-512mb`, file
  storage `0.5c-512mb`, database `0.1c-256mb`.
- [x] 4. A Render part in the hosting doc.
