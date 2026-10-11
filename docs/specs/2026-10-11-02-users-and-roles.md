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

- When a developer runs the start command, then the database starts in
  Docker and the app opens with the menu.
- When a developer runs the sample data command, then Ganti peran lists
  one sample account per role, one account with two roles, and Mahasiswa
  sample accounts across the study programs.
- When a student record is kept, then it holds the fields the prototype
  shows: NIM, nama, prodi, jalur, jenis kelamin, angkatan, kelas,
  provinsi, instansi, flags (Afirmasi, Pembibitan, Internasional,
  Blended) and status (Aktif, Cuti, Non Aktif). Confirmed by a check.
- When a student is added, then they get an account with the student role,
  linked to their student record. Confirmed by a check.
- When the owner picks the account with two roles in Ganti peran, then the
  menu shows the pages of both roles together.
- When the owner picks any sample account in Ganti peran, then Masuk
  sebagai shows that account, and the menu shows only the pages its roles
  may open, in the prototype's order. Pages with tabs show only that
  role's tabs. The "Nilai karakter MEDALI" legend shows as in the
  prototype.
- When any account opens a page that is not built yet, then it sees the
  page title and an empty area.
- When an account types the address of a page its roles may not open,
  then it is refused.
- When the app asks whether a role may do something not on the permission
  list, then the answer is no. The list also limits rows: a mentor sees
  only their mentees, a head of study program only their program, a
  student only themselves. Confirmed by a check.
- When Kepala Unit opens Pengaturan > Pengguna dan peran, then they see
  every staff account with its roles, Kepala Unit accounts included, and
  can add an account, change its roles, or remove it. Students are not
  listed there.
- When Kepala Unit removes an account, then it disappears from the list
  and from Ganti peran, but it is not erased. Confirmed on the preview and
  by a check.
- When Kepala Unit gives or takes away a role, then the change is written
  to a log that cannot be edited: who, when, and what changed. Confirmed
  by a check.
- When an account without the right to manage users opens Pengaturan, then
  the Pengguna dan peran tab is not there.
- When the app runs on the campus server, then there is no Ganti peran.
  Confirmed by a check.
- When a key is needed, then it comes from settings outside the repo, and
  an example settings file lists the names only. Confirmed by a check.
- When a PR deploys, then its preview shows the sample accounts in Ganti
  peran. When `main` deploys, then its preview database takes the table
  changes and keeps its data.

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

- [x] 1. Docker runs the database locally, an example settings file lists
  the keys needed, and the tables for accounts, roles, study programs,
  students and the role-change log are added.
- [x] 2. The sample data command adds one account per role, one account
  with two roles, and made-up students.
- [x] 3. The permission list, the menu for each role and the "Ganti peran"
  picker are added. Each page appears as an empty page.
- [x] 4. Pengaturan > Pengguna dan peran lets Kepala Unit see, add, change
  and remove accounts and their roles, with every role change written to
  the log.
- [x] 5. Previews apply the table changes on deploy, and the PR preview
  database is reset to sample data.
