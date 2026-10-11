# Stages and PPKS programs

## What we want

The Kurikulum menu gets the section "Tahapan dan program per semester",
built like the prototype: a choice of Semester ganjil or Semester genap,
the four tahap, and the list of Program kegiatan PPKS for the chosen
semester. Staff who manage activities can add, change and remove PPKS
activities. Everyone else with the menu only reads them.

## Who it is for

- Add, change, remove: Kepala Unit and Pegawai UPK.
- Read only: Direktur / Wakil Direktur, Ketua Program Studi and Pengasuh.

## What should happen

- When any of the five roles opens Kurikulum, then below Nilai dasar SIKU
  they see "Tahapan dan program per semester" with the choice Semester
  ganjil / Semester genap, and four boxes: Penanaman, Penumbuhan,
  Pengembangan, Pematangan. Each box shows "Tahap (no) · tingkat (no) ·
  semester (no)" and the prototype's description. Tahap 1 and Semester
  ganjil are chosen at the start.
- When they choose Semester genap, then the semester numbers in the boxes
  change from 1, 3, 5, 7 to 2, 4, 6, 8.
- When they choose a tahap, then that box is marked and the panel below is
  titled "Program kegiatan PPKS semester (no)", with the line "Tahap
  (name), semester ganjil/genap. Daftar kegiatan tanpa tanggal."
- When the semester has activities, then they see a table with Kegiatan
  (name, description, and "tidak wajib" when not required), Nilai,
  Indikator utama and Target peserta. An empty target shows "-".
- When the semester has no activity, then they see "Belum ada kegiatan
  PPKS untuk semester ini."
- When Kepala Unit or Pegawai UPK presses "Tambah kegiatan PPKS", then a
  form opens with Nama kegiatan, Nilai MEDALI, Indikator utama yang
  dituju, Target peserta, "Wajib, dihitung dalam nilai kehadiran" (ticked
  at the start), Deskripsi, and the note "Tanggal dan jam pelaksanaan
  diatur di menu Kegiatan karakter."
- When they pick a Nilai MEDALI in the form, then its four main indicators
  appear to tick, with "(level semester ini)" on the one for this tahap.
  Unpicking a nilai removes its ticks.
- When they press "Simpan" with a name of at least 3 letters, one nilai
  and one indicator, then the activity appears in that semester's table
  with the message 'Kegiatan "(name)" disimpan.'
- When something is missing, then nothing is saved and the message says
  "Isi nama kegiatan.", "Pilih minimal satu nilai MEDALI." or "Pilih
  minimal satu indikator utama."
- When they press "Ubah" on a row, then the same form opens filled in, and
  "Simpan" keeps the changes. "Batal" closes the form with nothing
  changed.
- When they press "Hapus" in that form, then the activity leaves the list,
  with the message "Kegiatan dihapus dari daftar."
- When a read-only role opens the page, then there is no "Tambah kegiatan
  PPKS" and no "Ubah".
- When a role without the right sends an add, change or removal, then the
  server refuses it. Confirmed by a check.
- When Kepala Unit opens Pengguna dan peran, then the right to manage
  activities shows for Kepala Unit and Pegawai UPK.

## Not included

- "N mahasiswa aktif" in the tahap boxes, and Target peserta filled in by
  itself. Both wait for the current semester to exist in the app.
- The "Dijadwalkan" column. It comes with Kegiatan karakter.
- Penjabaran MEDALI per tahap, and the mark of the chosen tahap's level in
  Indikator utama (next spec).
- Kegiatan khusus dan tambahan (later spec).

## Open questions

None.

## Steps

- [x] 1. PPKS activities are stored per semester, each with who changed it
  and when. The list starts empty; sample data adds a few for the preview.
- [x] 2. The right to manage activities is added to the permission list
  for Kepala Unit and Pegawai UPK, with its checks.
- [x] 3. The page shows the heading, the semester choice and the four
  tahap boxes.
- [x] 4. The page shows the Program kegiatan PPKS table for the chosen
  semester.
- [x] 5. "Tambah kegiatan PPKS" adds an activity.
- [x] 6. "Ubah" changes an activity.
- [ ] 7. "Hapus" removes an activity from the list.
