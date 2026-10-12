# BAM roles for students

Group: Pengaturan

## What we want

Badan Asrama Mahasiswa is run by students, but today a BAM role can only
be given to a staff account in Pengaturan > Pengguna dan peran. Kepala
Unit gets a way to give a student one or more BAM roles on screen and to
take them away, so the dorm work can be handed to real students.

## Who it is for

- Give and take away: Kepala Unit (the right "Pengaturan pengguna dan
  peran", already merged).
- The student who gets a role: their menu grows by what that BAM role
  may open. Nobody else sees this panel.

## What should happen

- When Kepala Unit opens Pengaturan > Pengguna dan peran, then under the
  staff list they see the panel "Badan Asrama Mahasiswa" with every
  student who holds a BAM role: name, NIM, program studi and the roles
  as badges, 25 a page. With none: "Belum ada mahasiswa dengan peran
  BAM."
- When they press "Tambah pengurus BAM", type a name or NIM in "Cari
  nama atau NIM", pick a student, tick one or more of BAM - BPHK,
  BAM - KI, BAM - Kerumahtanggaan, BAM - Kerohanian, BAM - Konsumsi,
  BAM - Senipora and BAM - Kesehatan, and press "Simpan peran", then the
  student shows in the panel and the message says "(name) ditambahkan
  sebagai (roles)."
- When no student or no role is picked, then nothing is saved and the
  message says "Pilih mahasiswa terlebih dahulu." or "Pilih minimal satu
  peran."
- When they search, then only students who are Aktif are offered. A
  student on Cuti, Non aktif or removed is not.
- When they press "Edit peran" on a row, change the ticks and save, then
  the row shows the new roles. When they press "Hapus" and confirm, then
  the student loses every BAM role and leaves the panel; the student's
  own record and Mahasiswa role stay.
- When the student with a new BAM role opens the app, then their menu
  shows their own pages and the pages of that BAM role together, as for
  any account with two roles. Confirmed on the preview with Ganti peran.
- When a BAM role is taken away, then on the student's next page the
  BAM pages are gone and a hand-made request for them is refused.
  Confirmed by a check.
- When a student with a BAM role becomes Cuti or Non aktif, or is
  removed in Pengguna baru mahasiswa, then the BAM roles stop working at
  once and the row shows "Tidak aktif" until Kepala Unit removes it.
  Confirmed by a check.
- When a BAM role is given, changed or taken away, then a line goes to
  the log of role changes: who, when and what changed. Confirmed by a
  check.
- When any role but Kepala Unit opens the panel by its address or sends
  a hand-made change, or someone tries to give a student any role that
  is not a BAM role, then the server refuses it. Confirmed by a check.
- When "Simpan peran" is pressed twice, or the same student is added
  twice, then there is one row. Confirmed by a check.
- When the panel is opened on a phone, then each student is a card with
  no sideways scroll, and it shows within about 1 second on the preview.

## Not included

- Any other role for a student, such as Pengasuh or Konselor.
- BAM roles on staff accounts: they stay as merged.
- What each BAM role may do; that is in the Asrama specs.
- A term of office or an end date for a BAM role.
- Kakak pendamping (Dorm companions); it is not a role.

## Better than the prototype

- The prototype makes a BAM member a separate staff-like account with a
  NIP. Here the role sits on the student's own account, so one person
  signs in once.
- A student who is no longer active cannot keep using a BAM role.

## Decided

The open questions, each decided as the issue suggested:

1. Kepala Unit only may give a BAM role, as in the prototype. Pengelola
   Asrama does not.
2. The student does not have to live in a dorm. Any Aktif student may be
   picked.
3. One student may hold several BAM roles.
4. A BAM role is not removed by itself when the student stops being
   Aktif. It stops working at once and the row stays, marked "Tidak
   aktif", until Kepala Unit removes it.

Decided while building, where the issue did not say:

- No new right is added. The merged right "Pengaturan pengguna dan
  peran" also covers this panel, as the issue names it.
- A student account is managed only in this panel. It no longer shows in
  the staff list above it, and the staff list's "Edit peran" and "Hapus"
  refuse a student account. Otherwise a student could be given a staff
  role there.
- A row marked "Tidak aktif" offers only "Hapus". Its roles cannot be
  edited, the same as such a student cannot be picked.
- The search offers at most 10 students, by name, and leaves out
  students who are already in the panel. Their roles are changed with
  "Edit peran".
- Only the BAM roles stop for a student on Cuti or Non aktif. Their
  Mahasiswa role and own pages stay as merged.
- The log line for taking the roles away says the roles changed, with
  the roles before and after. The account itself is not removed.
- The sample data gets no student with a BAM role. The role is given on
  screen to try it.

## Open questions

None.

## Steps

- [x] 1. The right to give BAM roles to student accounts, limited to the
  seven BAM roles, with its checks.
- [x] 2. The panel "Badan Asrama Mahasiswa" with its list and empty
  state.
- [x] 3. "Tambah pengurus BAM": search, pick, tick roles and save.
- [ ] 4. "Edit peran" and "Hapus", with the log lines.
- [ ] 5. Roles stop for a student who is not Aktif or was removed, with
  the check.
- [ ] 6. Double press, the phone layout and the speed check.
