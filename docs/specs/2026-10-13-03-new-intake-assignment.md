# New intake assignment

Depends on: Mentor groups, Mentor list

## What we want

The Pengasuh menu gets the tab "Penetapan angkatan baru". For an
angkatan whose students have no group yet, staff form the groups, pick
one mentor per group, and fix it with a decree number. Pegawai UPK
prepares and submits; Kepala Unit fixes it. Once fixed, the groups hold
until graduation; later changes go through mentor replacement.

## Who it is for

- Prepare, save and submit: Pegawai UPK and Kepala Unit.
- Fix ("Tetapkan") and cancel: Kepala Unit.
- Read only: Direktur / Wakil Direktur and Ketua Program Studi (their
  program's groups only).

## What should happen

- When one of these roles opens the tab, then "Angkatan" lists each
  angkatan with active students and no fixed groups, plus every angkatan
  with a penetapan, with student count and status (Belum dibentuk, Draf,
  Diajukan, Ditetapkan, Dibatalkan), the newest first and marked
  "terbaru"; and "Alur penetapan" explains the four steps.
- When Pegawai UPK or Kepala Unit choose an angkatan, then they see
  "1. Mahasiswa baru angkatan (year)" (count, putra and putri, count per
  program and jalur) and "2. Bentuk kelompok": Ukuran target (25–35,
  30 at the start), Metode pembagian (Seimbang jenis kelamin dan
  provinsi, Urut NIM, Mengikuti kelas akademik) and "Bentuk kelompok".
- When they press "Bentuk kelompok", then groups are formed per program
  and jalur, coded like "KP 26-D3PJK-01", and the draft is saved.
  "Bentuk ulang" asks first, because it replaces the draft.
- When they look at "3. Pengasuh setiap kelompok", then each group shows
  program, members, putra / putri, a mentor choice (mentors not Tidak
  aktif and not holding a group of another angkatan, the same jurusan
  first and marked), and "Anggota" to see members and move one to
  another group of the same program and jalur. "Isi otomatis yang
  kosong" fills empty choices, same jurusan first.
- When a group is empty of a mentor or one mentor is chosen twice, then
  a note says so and the submit and fix buttons stay off. A group
  outside 25–35 gets a warning only.
- When Pegawai UPK fills "4. Penetapan" (Nomor surat keputusan, Berlaku
  mulai) and presses "Ajukan ke Kepala UPK", then the status becomes
  Diajukan. "Simpan draf" saves without submitting.
- When Kepala Unit presses "Tetapkan" without a decree number, then
  nothing happens and the message asks for it. With one, a confirmation
  names the groups and students; on yes, the groups take effect at once
  and the angkatan shows "sudah ditetapkan" with the read-only table.
  "Berlaku mulai" is kept as the groups' start date and shows as
  "sejak".
- When the app decides "the same jurusan", then it works out a
  program's jurusan from its name, as the prototype does: a name with
  Pajak or PBB is Jurusan Pajak, with Akuntansi Jurusan Akuntansi,
  with Kepabeanan Jurusan Kepabeanan dan Cukai, any other Jurusan
  Manajemen Keuangan; a mentor matches when the unit of their account
  is that jurusan. Confirmed by a check.
- When Kepala Unit presses "Batalkan penetapan" on a fixed angkatan
  and confirms a question that says its students go back to having
  no group, then the message says "Penetapan dibatalkan.", the
  angkatan shows the status Dibatalkan, "Riwayat proses" adds the
  line, its students show "Belum ditetapkan" and their mentors no
  longer see them. As in the prototype, the cancelled groups and
  mentor choices stay as a draft that can be changed, saved, submitted
  and fixed again. The groups that were in force are ended with who
  and when, never erased, and everything recorded for those students
  stays. Any other role that sends a cancel is refused. Confirmed by
  a check.
- When anyone saves, then "Riwayat proses" adds who did what and when.
  It cannot be changed. Confirmed by a check.
- When two people save the same draft at once, then the second is told
  the draft changed and is shown the latest. Confirmed by a check.
- When a draft names a student who was removed meanwhile, then that
  student is dropped from the draft with a note.
- When Direktur, Ketua Program Studi or Pengasuh send a save, submit or
  fix, or Pegawai UPK sends a fix, then the server refuses it. Confirmed
  by a check.
- When the tab opens on a phone, then no sideways scroll; groups become
  cards.
- When the preview opens an angkatan of about 60 students, then the tab
  shows within about 1 second.

No case was met on `main` before this spec: the tab was empty. All of it
is built here.

## Not included

- Putting a student added later into an existing group ("Mentor group
  for a late student").
- Sending a submitted draft back to draft; the prototype has none.
- The group size of 25 to 35 and the target of 30 are the prototype's
  values, to be confirmed by the campus before launch.

## Better than the prototype

- The list shows angkatan that need groups, not every angkatan of 20 or
  more students.
- Concurrent edits are caught instead of the last save winning.
- Removed students drop out of a draft with a note.

## Decided

1. Before penetapan there are no temporary groups. New students show
   "Belum ditetapkan".
2. The groups start at once, on confirming, as in the prototype.
   "Berlaku mulai" is the start date written on the groups.
3. Kepala Unit cannot send a submitted draft back with a reason. Kepala
   Unit changes the submitted draft directly before fixing it.
4. Kepala Unit can cancel a fixed penetapan with "Batalkan penetapan",
   after a confirmation and with no time limit. The groups are ended,
   not erased, and stay as a draft that can be fixed again.
5. The sample data gets a new angkatan of about 60 made-up students in
   two programs with no groups, and two spare mentors.

## Steps

- [x] 1. Penetapan drafts and their process log are stored, with the
  sample new angkatan.
- [x] 2. The permissions for preparing and fixing, with their checks.
- [x] 3. The rule that forms groups by the three methods, with tests.
- [x] 4. The tab with the angkatan list, step 1 and step 2.
- [x] 5. Step 3: mentor choice, automatic fill and moving members.
- [x] 6. Step 4: save, submit, fix, and the fixed view with the log.
- [ ] 7. "Batalkan penetapan" for Kepala Unit, with its check.
- [ ] 8. Concurrent edits, removed students, refusals and phone
  layout.
