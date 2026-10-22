# Dashboard: mentor dashboard overview

Depends on: Mentor groups; Dashboard filter and character achievement;
Dashboard character grade; Dashboard physical health; Dashboard mental
health; Mentoring meetings; Mentoring scores; Mentoring notes; Character
coaching list; Discipline penalties; Sharing the screening level;
Academic period
Group: Dashboard

## What we want

Pengasuh gets their own Dashboard, "Dashboard anak asuh", built like the
prototype. Its top part tells them at a glance what they still have to
fill in this semester, how their anak asuh are doing in the four aspects,
and which anak asuh need attention and why. Every number covers only
their own anak asuh.

## Who it is for

Pengasuh.

## What should happen

- When a Pengasuh with a group opens Dashboard, then they see "Dashboard
  anak asuh" and "Empat aspek penilaian (n) anak asuh Anda di (kelompok),
  angkatan (tahun)."
- When a Pengasuh without a group opens it, then they see only "Anda
  belum memegang kelompok pengasuhan. Data akan tampil setelah Kepala
  Unit menugaskan kelompok kepada Anda."
- When they look at the progress box, then it says "Semester (periode):
  (n) dari (jumlah) pertemuan pengasuhan sudah diisi daftar hadirnya, dan
  (n) dari (total) anak asuh sudah Anda nilai.", with the links "Isi
  daftar hadir" and "Isi nilai pengasuhan". It is marked as a warning
  until both are complete.
- When they look at the four cards, then Capaian karakter, Nilai karakter
  and Kesehatan jasmani show the same numbers as the main Dashboard, for
  their anak asuh. Kesehatan mental shows how many records are
  "dipublikasikan" to them and "(n) perlu konseling. Hanya data yang
  disetujui mahasiswa." There is no filter.
- When they look at "Perlu perhatian", then each anak asuh with at least
  one reason shows the name, "MEDALI (rerata)" or "belum diasesmen", and
  one tag per reason: "Capaian: pembinaan (tingkat)", "Nilai karakter
  (huruf)" below the minimum, "Kehadiran kegiatan (n)%" under 75,
  "Hukuman disiplin (kategori)", "Jasmani: (kategori)" for the two lower
  categories, and "Mental: (tingkat)" only when published to them at
  Sedang or worse. "Capaian: pembinaan" follows the coaching list, and
  "Kehadiran kegiatan" is the Nilai kehadiran of the character grade.
  Most reasons first, then lowest average.
- When more than 8 need attention, then "Lihat semua" shows the rest.
  When none does, then they see "Tidak ada anak asuh yang perlu perhatian
  khusus saat ini."
- When they look at "Catatan pengasuhan terbaru", then they see their 5
  latest notes, "Tulis catatan" to Pengasuhan, and the numbers Catatan 30
  hari, Perlu pembinaan (their anak asuh on the coaching list who are not
  yet "Selesai"), Pelanggaran disiplin and Rerata kehadiran kegiatan ("-"
  when there is none).
- When an account that is both Pengasuh and Kepala Unit, Direktur / Wakil
  Direktur or Ketua Program Studi opens Dashboard, then a switch at the
  top chooses between "Dashboard pembangunan karakter" and "Dashboard
  anak asuh"; each view keeps its own limits.
- When a student leaves their group or the group goes to another
  Pengasuh, then that student leaves every number on the next load.
- When a Pengasuh sends a hand-made request for another Pengasuh's group
  or a student who is not their anak asuh, then the server refuses it.
  Confirmed by a check.
- When the page is opened on a phone, then the cards and panels stack and
  the tags wrap, with no sideways scroll.
- When the page opens on the preview with sample data, then it shows
  within about 1 second.

## Not included

- Sections 1 to 4, Pelanggaran disiplin and the Anak asuh table (Mentor
  dashboard sections and mentee table).
- Filling in attendance, scores and notes (Pengasuhan).
- Making the 75 for "Kehadiran kegiatan" a setting. It is the
  prototype's value, to be confirmed by the campus before launch.

## Decisions

1. "Kehadiran kegiatan under 75" stays 75 for now, as one named value a
   later spec can make a setting.
2. The number of pertemuan per semester is read from Pengasuhan, where it
   is decided.
3. A person who is both Pengasuh and one of the Dashboard roles sees both
   Dashboards, with a switch at the top of the page.
4. The main Dashboard's rule of hiding an average of fewer than 5
   students does not apply here: Pengasuh already sees each anak asuh's
   own values in Pengasuhan.

## Steps

- [x] 1. "Dashboard anak asuh" opens for Pengasuh, limited to their own
  anak asuh, with the message for a Pengasuh without a group and the
  switch for an account with both Dashboards.
- [x] 2. The progress box with its two links.
- [x] 3. The four cards for anak asuh.
- [ ] 4. "Perlu perhatian" with its reasons and "Lihat semua".
- [ ] 5. "Catatan pengasuhan terbaru" and its four numbers.
