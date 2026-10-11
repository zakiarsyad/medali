# Users and roles

## What we want

The app gets its database, on a local computer and on the previews. The
first records are every person who uses the app, staff and students, each
with their roles, and one list that says what each role may do. Each role
sees only its own menu, and Kepala Unit can manage accounts and roles in
Pengaturan > Pengguna dan peran.

## Who it is for

Kepala Unit, who manages accounts and roles. Every role, through its own
menu. The owner, who can switch between sample accounts to see which role
sees what.

## What should happen

- When someone runs the start command, then the database starts in Docker
  and the app connects to it.
- When someone runs the sample data command, then there is one sample
  account per role, one account with two roles, and made-up students
  across the study programs.
- When a student record is kept, then it holds the fields the prototype
  shows: NIM, nama, prodi, jalur, jenis kelamin, angkatan, kelas,
  provinsi, instansi, flags (Afirmasi, Pembibitan, Internasional,
  Blended) and status (Aktif, Cuti, Non Aktif).
- When a student is added, then they get an account with the student role,
  linked to their student record.
- When a person has several roles, then all are kept, never merged into a
  combined role, and their menu shows the pages of all their roles
  together.
- When the app checks whether a role may do something, then it uses one
  list of named actions taken from the prototype. Anything not on the list
  is refused. The list also says which rows a role sees: a mentor only
  their mentees, a head of study program only their program, a student
  only themselves.
- When the app runs locally or on a preview, then "Masuk sebagai" shows
  the account in use and "Ganti peran" lets you pick any sample account.
  On the campus server there is no "Ganti peran".
- When an account is picked, then the menu shows only the pages its roles
  may open, in the prototype's order, and pages with tabs show only that
  role's tabs. The "Nilai karakter MEDALI" legend shows as in the
  prototype.
- When a page that is not built yet is opened, then it shows its title and
  an empty area.
- When someone opens the address of a page their roles may not open, then
  they are refused.
- When Kepala Unit opens Pengaturan > Pengguna dan peran, then they see
  every account with its roles, and can add an account, change its roles,
  or remove it.
- When an account is removed, then it is hidden and can no longer be
  picked, but it is not erased.
- When a role is given or taken away, then the change is written to a log
  that cannot be edited: who, when, and what changed.
- When a role without the right to manage users opens Pengaturan, then the
  Pengguna dan peran tab is not there.
- When a key is needed, then it comes from settings outside the repo. An
  example settings file lists the names only.
- When a PR deploys, then the shared PR preview database is reset to
  sample data with that PR's tables. When `main` deploys, then its preview
  database takes the table changes and keeps its data.

## Not included

- The Pengguna baru mahasiswa tab (next spec).
- The content of every other page.
- Numbers on menu items, such as the count next to Pembinaan.
- File storage, Google sign-in, mentor groups, and the tables of each
  feature area.

## Decided

- Uploaded files on previews will go to a free service that works the same
  way as MinIO, so the same code works everywhere. The file storage spec
  builds it.

## Open questions

None.

## Steps

- [ ] 1. Docker runs the database locally, an example settings file lists
  the keys needed, and the tables for accounts, roles, study programs,
  students and the role-change log are added.
- [ ] 2. The sample data command adds one account per role, one account
  with two roles, and made-up students.
- [ ] 3. The permission list, the menu for each role and the "Ganti peran"
  picker are added. Each page appears as an empty page.
- [ ] 4. Pengaturan > Pengguna dan peran lets Kepala Unit see, add, change
  and remove accounts and their roles, with every role change written to
  the log.
- [ ] 5. Previews apply the table changes on deploy, and the PR preview
  database is reset to sample data.
