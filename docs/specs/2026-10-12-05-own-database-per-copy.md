# Own database for each copy of the repo

## What we want

More than one copy of the repo can be worked on at the same time on one
computer, each with its own data. Today every copy uses the same two
databases in the local Docker database: one for the app's sample data and
one for the checks. The address of the checks' database is fixed, so two
copies running their checks, or filling in sample data, overwrite each
other. After this work, each copy can name its own two databases inside
the one local Docker database, and a copy that names nothing works exactly
as it does today.

## Who it is for

- Anyone who builds on this repo, and the builders that work without
  anyone watching, each in its own copy.
- No role in the app sees a difference.

## What should happen

- When a developer sets nothing and runs the app, the sample data command
  and the checks, then everything works as it does today, with the same
  two databases. Confirmed by a check.
- When a copy of the repo sets the address of its checks' database in its
  local settings, then its checks use that database and never the default
  one. Confirmed by a check.
- When that address names the same database as the app's own address, then
  the checks refuse to run and say why, so sample data is never wiped by a
  check. Confirmed by a check.
- When two copies with different database names run their full checks at
  the same time, then both pass and neither changes the other's data.
  Confirmed on a local computer.
- When a copy runs the command that makes its databases, then both
  databases exist in the local Docker database, with the tables and sample
  data in the first; running it again changes nothing. Confirmed on a
  local computer.
- When a copy runs the command that removes its databases, then only its
  own two are removed. The default two can never be removed this way, and
  neither can a database on any address other than the local computer.
  Confirmed by a check.
- When the checks run on GitHub, then they pass as before.

## Not included

- A separate database for each PR preview.
- Starting builders in parallel; that is set up outside this repo.
- A separate file storage for each copy.

## Better than today

- The checks can no longer be pointed at the sample data by mistake.

## Decided

1. The setting is called `TEST_DATABASE_URL`. It sits next to
   `DATABASE_URL` in the local settings file and is described in the
   example settings file.
2. The copy chooses the names of its databases. The two commands take the
   names from its local settings. The unattended builders use
   `medali_<issue>` and `medali_<issue>_test`.

Decided while building, because the issue did not say:

3. The command that makes the databases is `pnpm db:create`, and the one
   that removes them is `pnpm db:remove`.
4. A setting given on the command line wins over the same setting in the
   local settings file, as it already does for the other commands.
5. The making command fills in sample data only when the app's database
   has no tables yet. That is how running it again changes nothing.
6. The making command also refuses any address other than the local
   computer, as the removing command does.
7. The removing command keeps a default database and says so, and removes
   the copy's other database. It also never removes the databases that the
   database server itself needs.
8. A database name may hold only small letters, digits and underscores.
   Both commands refuse any other name.
9. The checks never read the other local settings, such as the file
   storage, so they run the same on every computer and on GitHub.

## Steps

- [x] 1. The checks read the address of their database from a setting,
  fall back to today's address, and refuse to run against the app's own
  database.
- [x] 2. A command makes the two databases a copy's settings name, with
  tables and sample data, and is safe to run twice.
- [x] 3. A command removes a copy's two databases, never the default two
  and never one outside the local computer.
- [ ] 4. The set-up instructions and the rules on running the app locally
  say how to work in more than one copy.
