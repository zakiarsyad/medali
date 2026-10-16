# Dorm health notes

Depends on: Dorm residents and rooms, Health notes, Fitness test scores, Mentor groups
Group: Asrama

## What we want

The tab Kesehatan gets its content. BAM - Kesehatan and Kepala Unit
write health notes for dorm residents: illnesses they have had, medicine
they take, advice, and a health category. Staff allowed to see them get
the list "Mahasiswa asrama yang sakit", so the dorm knows who needs
care. Health records are sensitive, so only the roles named here see
them.

## Who it is for

- Write, and read the list: Kepala Unit and BAM - Kesehatan, for
  residents of every dorm, as in the prototype.
- Read the list, no form: Pengelola Asrama and BAM - BPHK (residents of
  every dorm) and Pengasuh (their own mentees who live in the dorm).
- Numbers only, no names, illnesses or notes: Direktur / Wakil Direktur
  and Ketua Program Studi (their study program only).

## What should happen

- When a writer opens Kesehatan, then they see "Catatan kesehatan" with
  Mahasiswa (residents only), Tanggal, Pemeriksa, the buttons under
  "Riwayat penyakit" (Asma, Hipertensi, Diabetes melitus, Penyakit
  jantung, Gangguan lambung, Alergi, Epilepsi, Cedera atau operasi
  tulang/sendi, Penyakit menular, Lainnya), "Riwayat lain", "Obat yang
  rutin diminum", "Catatan dan rekomendasi" and "Pertimbangan kategori".
- When they pick a student, then the last note and "Kategori sekarang"
  show, and the form is filled from that note.
- When they press an illness, then a note field for it appears and
  "Pertimbangan kategori" moves to the category that illness suggests.
  A line shows the fitness test result and the final category, which is
  the heavier of the two.
- When they press "Simpan catatan", then a new note is saved, earlier
  notes are kept, and a message names the student's category. No
  student, a future date, or no illness and no note is refused.
- When any allowed role opens the tab, then they see the numbers
  "Penghuni asrama", "Sakit atau punya riwayat penyakit", "Perlu
  perhatian" and "Perlu tindak lanjut medis" (with how many lack a
  note). Every role but Direktur and Ketua Program Studi also sees
  "Mahasiswa asrama yang sakit" with Mahasiswa, Kamar, Pengasuh,
  Kategori, "Riwayat penyakit dan catatan" and Dicatat.
- When Direktur or Ketua Program Studi opens the tab, then they see the
  four numbers and no list, search or filter. A number that covers 1 to
  4 residents shows as "<5". When fewer than 5 residents are in their
  reach, no number shows, only the line "Rekap ditampilkan setelah
  minimal 5 penghuni, agar identitas tidak dapat ditebak."
- When they use "Cari nama atau NIM" or the filters by dorm, category
  and illness, then the list follows, 25 per page. With no match it
  says "Tidak ada mahasiswa asrama yang sakit pada filter ini."
- When a role without the form opens the tab, then a note says who
  fills the notes, and there is no form.
- When Pengasuh opens the tab, then the numbers and the list hold only
  their own mentees; for Ketua Program Studi the numbers count only
  their study program.
- When a resident, another BAM role, Konselor, Penilai Mahasiswa,
  Pegawai UPK or Pembina Disiplin types the address, then it is
  refused. When a read-only role sends a hand-made note, Pengasuh asks
  for a student who is not their mentee, or Direktur or Ketua Program
  Studi asks by hand for a name, an illness or a note, then the server
  refuses it. Confirmed by a check.
- When "Simpan catatan" is pressed twice, then one note is saved. When
  two writers save for the same student, then both notes are kept and
  the newer one counts. Every note adds a line to the change log.
  Confirmed by a check.
- When BAM - Kesehatan fills the form on a phone, then it fits one
  column and each row of the list is a card.
- When the tab opens on the preview, then it shows within about 1
  second.

## Not included

- The mark "Potensi kesehatan mental" (Mental health early marker).
- Notes for students outside the dorm (Health notes), and fitness
  tests (Fitness test scores).
- The health-note record itself: Health notes adds it first, and this
  spec writes dorm notes into the same record.
- Sick reports sent by the resident: the prototype has none.
- Marking a note as removed: the prototype has none, and neither has
  Health notes. A wrong note is put right by saving a new one.

## Better than the prototype

- The server limits the list to the role's own students; the prototype
  only hides rows on screen.
- A future date is refused, and a double save makes one note.
- Direktur and Ketua Program Studi get numbers only; the prototype
  shows them every name and note.

## Decided

1. BAM members are students. BAM - Kesehatan may write, and BAM - BPHK
   read, other residents' illnesses, as in the prototype, for residents
   of every dorm.
2. A resident does not need to consent before notes are shared with
   Pengasuh, Ketua Program Studi and Direktur, as in the prototype;
   Direktur and Ketua Program Studi see numbers only, as the cases say.
3. A resident sees their own health notes on Profil saya (My health on
   my profile), not on Asrama.
4. The tab has three rights of its own in the permission list: writing
   notes (Kepala Unit, BAM - Kesehatan), reading the list of sick
   residents (the writers, Pengelola Asrama, BAM - BPHK, and Pengasuh
   for their own mentees), and reading the numbers only (Direktur /
   Wakil Direktur, and Ketua Program Studi for their own study
   program). The rights of Health notes on Penilaian give nothing here,
   and these give nothing on Penilaian.

## Steps

- [x] 1. Sample health notes for residents in every category are
  added to the record that Health notes brings.
- [x] 2. The rights to write and to read dorm health notes are added to
  the permission list, with their checks.
- [ ] 3. The numbers and the list of sick residents show, with search,
  filters and pages.
- [ ] 4. Writers save a health note, with the category hint.
- [ ] 5. Pengasuh sees only their own mentees; Direktur and Ketua
  Program Studi see numbers only.
