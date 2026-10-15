# Fitness test scores

Depends on: Mentor groups, Character grade scheme
Group: Penilaian

## What we want

Penilaian gets the tab "Penilaian jasmani". Once a year each student
takes a fitness test and gets a score from 0 to 100. Staff enter the
scores for a whole mentor group at once. The score puts the student in
one of four categories, whose limits Kepala Unit can change. Fitness
results are health data, so each role sees only its own students.

## Who it is for

- Enter scores: Kepala Unit and Penilai Mahasiswa (right "Penilaian
  jasmani").
- Change the limits: Kepala Unit (right "Bobot penilaian", which
  Character grade scheme adds; it is not added again here).
- Read: Direktur / Wakil Direktur, Ketua Program Studi (own program),
  Pengasuh (own mentees).

## What should happen

- When a staff role opens the tab, then they see four numbers (Sudah
  dites (year): the students whose latest test is in the calendar year
  now running, Rerata skor, Perlu perhatian, Perlu tindak lanjut medis),
  the panel "Kategori" with a bar and score range for each category and
  how many are not yet tested, and "Hasil tes kebugaran".
- When anyone looks at a category, then it comes from the student's
  latest test: Prima from 85, Baik from 70, Perlu perhatian from 55,
  below that Perlu tindak lanjut medis. Scores 85, 84, 70, 69, 55, 54
  give Prima, Baik, Baik, Perlu perhatian, Perlu perhatian, Perlu tindak
  lanjut medis. No test gives "Belum dites". Confirmed by a check.
- When Kepala Unit changes "Ambang skor" and presses "Simpan ambang",
  then every category is worked out again: "Ambang kategori disimpan."
  With Baik mulai 75, a score of 72 becomes Perlu perhatian. Limits that
  are not whole numbers 1–100 or do not go down save nothing: "Ambang
  harus menurun: prima > baik > perlu perhatian."
- When Kepala Unit or Penilai Mahasiswa picks a "Kelompok mahasiswa"
  and "Tanggal tes", then "Tahun tes" shows the year of that date and
  cannot be typed, and every member shows with "Skor saat
  ini" and a field "Skor baru"; typing a score shows its category and
  "(n) skor siap disimpan."
- When they press "Simpan skor", then the filled scores are saved, empty
  fields are skipped, and the message says "(n) skor tes kebugaran
  disimpan." With none filled: "Isi minimal satu skor." A score outside
  0–100 or a test date in the future saves nothing and says why.
- When they look at the list, then each student shows the test date,
  Skor and Kategori, with search, a filter by category and "Belum
  dites", 25 a page, the most serious category first.
- When a read-only role opens the tab, then it says "Hasil tes kebugaran
  diinput oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa."
- When Pengasuh asks for a student outside their groups, Ketua Program
  Studi for another program, a student or Konselor for any list, or
  Penilai Mahasiswa sends new limits by hand, then it is refused and no
  score is sent. Confirmed by a check.
- When two people save the same group at once, then both saves are kept
  in order and the later score counts. Pressing "Simpan skor" twice saves
  once. Scores and limits go into the log. Confirmed by a check.
- When used on a phone, then the group form and the list become cards
  with no sideways scroll. The tab shows within about 1 second.

## Not included

- "Unggah berkas" (Fitness test file upload) and "Catatan kesehatan"
  (Health notes), so a category comes from the test score only.
- The student's own result (My health on my profile).
- Opening the student detail from a name in the list (Scores in the
  student detail).
- "Riwayat input" and cancelling a saved score: the prototype has
  none; a wrong score is replaced by saving the right one.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- A test date cannot be in the future, and "Tahun tes" follows the date.
- A score that is not a whole number is refused with a message instead
  of being rounded silently.

## Decided

1. The limits start at 85, 70 and 55, with the note "Ambang awal,
   sesuaikan dengan pedoman tes kebugaran." until Kepala Unit saves new
   ones with "Simpan ambang".
2. A score entered for the wrong student is not taken back: a new save
   for that student replaces it; nothing more is built.
3. A category stays when a new year starts and the student is not yet
   tested again. The list shows it with its test date, so its year is
   seen; "Sudah dites (year)" counts only tests of the running year.
4. A student's latest test is the one saved last, as in the prototype,
   so a correction always wins even when its test date is earlier.
5. Every score saved stays as history; only the latest one is shown.
6. The numbers, the panel "Kategori" and the list cover the Aktif
   students the role may see. Kepala Unit, Penilai Mahasiswa and
   Direktur / Wakil Direktur see every student, as on Asesmen karakter.
   Rerata skor is the average of the latest scores, to one decimal, or
   "-" with none. Its hint is "(n) prima dan baik"; the hint of "Sudah
   dites" is "dari (n) mahasiswa aktif". The two other numbers have no
   hint, since the health notes their hints speak of are not built.
7. "Kelompok mahasiswa" lists the mentor groups in force, and the form
   shows their Aktif members. A saved score for a student who is not an
   Aktif member of the chosen group is refused.
8. "Tanggal tes" starts at today. Its year is worked out by the server
   from the date, never taken from the browser.
9. The messages for a refused save are "Skor harus bilangan bulat
   0–100." and "Tanggal tes tidak boleh setelah hari ini."
10. The limits are kept as a new row for each change, with who set them
    and when, like the Skema bobot. A save made on limits that someone
    else has changed meanwhile is refused with "Ambang sudah diubah oleh
    (name). Muat ulang.", as Skema bobot does. Read-only roles see the
    limits without fields to type in, and "Ambang ditetapkan oleh Kepala
    Unit Pembangunan Karakter."
11. The list is sorted with the most serious category first, then the
    lowest score, then the name; "Belum dites" comes last. Each row shows
    the name, NIM and program.

## Steps

- [ ] 1. Fitness scores and the three limits are stored; the right
  "Penilaian jasmani" is added, with checks; sample scores.
- [ ] 2. The category rule, with checks.
- [ ] 3. The tab shows the numbers, "Kategori" and the list.
- [ ] 4. "Simpan ambang" changes the limits.
- [ ] 5. The group form saves scores.
