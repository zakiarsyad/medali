# Health notes

Depends on: Fitness test scores; Dorm residents and rooms; Mentor groups
Group: Penilaian

## What we want

Penilaian jasmani gets "Catatan kesehatan" for students who do not live
in the dorm: illness history, regular medicine, advice, and a category
the examiner thinks fits. The student's final category is the more
serious of the fitness test and the note. Kepala Unit gets a
recap of every student who is ill. Health notes are sensitive. This
spec adds the health-note record; Dorm health notes later writes dorm
residents' notes into the same record.

## Who it is for

- Write notes, and read the latest note in "Hasil tes kebugaran":
  Kepala Unit and Penilai Mahasiswa (right "Penilaian jasmani").
- Read the recap of all students, with names, illnesses and notes:
  Kepala Unit only.
- Read the note text of their own mentees, in "Hasil tes kebugaran":
  Pengasuh, as in the prototype.
- Numbers and categories only, never an illness or a note text:
  Direktur / Wakil Direktur and Ketua Program Studi (own program).
- The student reads the notes about themselves on Profil saya (My
  health on my profile). No other role reads a note here. Notes of
  dorm residents are also written by BAM - Kesehatan and read by
  Pengelola Asrama and BAM - BPHK on Asrama > Kesehatan, which Dorm
  health notes adds; they get nothing on Penilaian.

## What should happen

- When Kepala Unit or Penilai Mahasiswa picks a non-dorm student, then
  they see "Catatan terakhir", "Kategori sekarang", and the fields
  Tanggal, Pemeriksa, "Riwayat penyakit" (the prototype's ten choices),
  one short note per illness picked, "Riwayat lain", "Obat yang rutin
  diminum", "Catatan dan rekomendasi" and "Pertimbangan kategori" (Ikuti
  hasil tes kebugaran, Baik, Perlu perhatian, Perlu tindak lanjut medis).
- When they pick Penyakit jantung, Epilepsi, Diabetes melitus or Penyakit
  menular, then "Pertimbangan kategori" suggests Perlu tindak lanjut
  medis; Asma, Hipertensi, Cedera atau operasi tulang/sendi or Gangguan
  lambung suggest Perlu perhatian. They may change it.
- When anyone looks at a category, then it is the more serious of the
  test and the latest note. Test 88 (Prima) with a note "Perlu perhatian"
  gives Perlu perhatian, marked "berdasarkan catatan kesehatan"; test 50
  with a note "Baik" stays Perlu tindak lanjut medis; no test with a note
  "Perlu perhatian" gives Perlu perhatian. Confirmed by a check.
- When they press "Simpan catatan", then the message says "Catatan
  kesehatan (name) disimpan. Kategori: (category)." With no illness and
  no text: "Isi riwayat penyakit atau catatan." A dorm resident cannot be
  picked: their notes are written in Asrama > Kesehatan.
- When a note is saved again for a student, then the new one counts and
  the earlier ones stay as history.
- When Kepala Unit looks at "Rekap data kesehatan seluruh
  mahasiswa", then they see four numbers ("Mahasiswa aktif", "Sakit
  atau punya riwayat penyakit", "Perlu perhatian", "Perlu tindak lanjut
  medis") and every student with an illness history, a note with a
  category, or Perlu tindak lanjut medis: Kamar or "Non asrama",
  Pengasuh, Kategori, illnesses and note, who and when; with search and
  filters by tempat tinggal, kategori and riwayat penyakit, 25 a page.
- When Kepala Unit, Penilai Mahasiswa or Pengasuh (own mentees) looks
  at "Hasil tes kebugaran", then the column "Catatan kesehatan" shows
  the latest note's illnesses and text, and a student in Perlu
  perhatian or worse with no note shows "Belum ada catatan".
- When Direktur or Ketua Program Studi looks at it, then they see the
  category only: no note text, no illness and no mark that a note
  exists or is missing, as in Scores in the student detail; and no
  recap.
- When Direktur, Ketua Program Studi, Konselor, a BAM role or a student
  asks by hand for a note's text or the recap here (BAM - Kesehatan and
  BAM - BPHK read dorm residents' notes on Asrama > Kesehatan only),
  Pengasuh for a student outside their groups, or Direktur sends a note,
  then it is refused and no note text is sent. Confirmed by a check.
- When two people save a note for one student at once, then both are
  kept and the later counts. Pressing twice saves once. Each note goes
  into the log, and notes are never erased. Confirmed by a check.
- When used on a phone, then the form is one column and the recap
  becomes cards. The recap shows within about 1 second.

## Not included

- Notes for dorm residents (Dorm health notes), and "Potensi kesehatan
  mental" (Mental health early marker): its number, filter choice and
  badge do not show in this recap.
- The student's own notes (My health on my profile).
- The line on Profil saya that tells students who reads their notes (My
  health on my profile).
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- Note text in "Hasil tes kebugaran" and the recap no longer show to
  Direktur and Ketua Program Studi; they see categories only.
- Tanggal cannot be in the future. Earlier notes can be seen.
- Each reading of the recap is logged, without the note text.

## Decided

1. Who may read a note's text: as in "Who it is for" above. Direktur
   and Ketua Program Studi see numbers and categories only.
2. The student does not have to agree before a note is shown to
   Pengasuh, as in the prototype, since it is needed for safety in
   activities.
3. Until Dorm health notes is built, nobody writes notes for dorm
   residents; this spec stays non-dorm only.
4. A student's latest note is the one saved last, as for fitness
   scores, so a correction always wins even when its Tanggal is earlier.
5. The ten choices of "Riwayat penyakit", in the prototype's order:
   Asma, Hipertensi, Diabetes melitus, Penyakit jantung, Gangguan
   lambung, Alergi, Epilepsi, Cedera atau operasi tulang/sendi, Penyakit
   menular, Lainnya. The suggestion is the most serious one of the
   illnesses picked; with none of the eight named in the cases, it is
   "Ikuti hasil tes kebugaran". Once the person changes "Pertimbangan
   kategori" by hand, picking illnesses no longer changes it, as in the
   prototype.
6. Picking a student fills the form with their latest note, as in the
   prototype, so a new note starts from the last one. With no note it
   shows "Belum ada catatan kesehatan." Beside "Pertimbangan kategori" a
   line shows "Hasil tes: (category). Kategori akhir: (category)." as
   in the prototype.
7. "Earlier notes can be seen": below "Catatan terakhir" the writers
   can open "Catatan sebelumnya", the student's earlier notes with
   their Tanggal, Pemeriksa and text, newest first.
8. "No text" means "Riwayat lain", "Obat yang rutin diminum" and
   "Catatan dan rekomendasi" are all empty. Tanggal starts at today and
   must be filled; Pemeriksa may stay empty. Each short field holds at
   most 200 characters and "Catatan dan rekomendasi" at most 2000; more
   saves nothing and says so.
9. The category in the saved message is written in small letters, as in
   the prototype: "Kategori: perlu perhatian." With no test and
   "Ikuti hasil tes kebugaran" it says "Kategori: belum dites."
10. A note's text is shown as in the prototype: "Riwayat: Asma (sejak
    SMP), Hipertensi; (riwayat lain). Obat: (obat). (catatan)".
11. In the recap, "a note with a category" is a latest note whose
    "Pertimbangan kategori" is not "Ikuti hasil tes kebugaran". The
    recap covers every Aktif student, dorm or not; a dorm resident shows
    there only through their test category until Dorm health notes adds
    their notes. It is sorted with the most serious category first, then
    by name.
12. The recap's numbers, as in the prototype: "Mahasiswa aktif" with the
    hint "(n) asrama · (n) non asrama"; "Sakit atau punya riwayat
    penyakit", the students the recap lists, with the hint "(n)%
    mahasiswa"; "Perlu perhatian" and "Perlu tindak lanjut medis", those
    of the listed students in each category, with the hints "pemantauan"
    and "(n) belum punya catatan" or "catatan lengkap".
13. "Who and when" in the recap is the latest note's Tanggal and its
    Pemeriksa, or the name of the person who saved it when Pemeriksa is
    empty. Pengasuh is the mentor of the student's mentor group in
    force, or "-".
14. The filter "Riwayat penyakit" offers the nine named illnesses, not
    "Lainnya"; a student matches when their latest note picks it. The
    tempat tinggal filter offers "Asrama dan non asrama", "Asrama" and
    "Non asrama". There is no filter by dorm.
15. A recap reading is logged once per page shown, with who read it,
    when, and the filters used; never a name, an illness or a note
    text.
16. The panel "Catatan kesehatan" with the form shows only to the
    writers. Other roles with the tab see no such panel, so no role
    learns more than its own rows allow.
17. For Direktur and Ketua Program Studi the mark "berdasarkan catatan
    kesehatan" is left out, as it tells that a note exists. A person
    who also holds a role that reads notes sees the column and the mark
    only on the rows that role allows.
18. Notes are kept like fitness scores: each note is a new row that
    cannot be changed or deleted, so the notes are their own log. The
    form makes the note's key, so a form sent twice is kept once.

## Steps

- [x] 1. Health notes are stored, never erased, with sample notes; who
  may write and read them is added to the permission list, with checks.
- [ ] 2. The final-category rule and the suggestion rule, with checks.
- [ ] 3. The form writes a note for a non-dorm student.
- [ ] 4. Categories everywhere on the tab use the final category, with
  the "Belum ada catatan" mark.
- [ ] 5. "Rekap data kesehatan seluruh mahasiswa" for Kepala Unit, with
  numbers, filters and the reading log.
