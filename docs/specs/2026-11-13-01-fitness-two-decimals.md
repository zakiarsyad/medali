# Fitness scores with two decimals

Depends on: nothing beyond what is merged
Group: Penilaian

## What we want

On "Penilaian jasmani", a fitness test score may have up to two
decimals, such as 85,25 or 72,5. Today any score that is not a whole
number is refused. After this change the score is saved exactly as
typed and shown with its decimals.

## Who it is for

- Enter scores: Kepala Unit and Penilai Mahasiswa.
- Read: Direktur / Wakil Direktur, Ketua Program Studi and Pengasuh.

## What should happen

- When Kepala Unit or Penilai Mahasiswa types "85,25" in "Skor baru"
  and presses "Simpan skor", then the score is saved as 85,25, it shows
  its category, and "1 skor tes kebugaran disimpan." appears.
- When they type "85.25" (with a dot), then it is read the same as
  "85,25".
- When they type a score with three or more decimals, such as "85,255",
  or a score outside 0–100, then nothing is saved and the message says
  "Skor harus angka 0–100, paling banyak 2 angka di belakang koma."
- When a score has decimals, then its category follows the limits
  exactly: with Prima from 85, a score of 84,99 is Baik and 85,00 is
  Prima. Confirmed by a check.
- When anyone looks at a score ("Skor saat ini", the "Hasil tes
  kebugaran" list, the student detail, Profil saya, Dashboard), then it
  is written with two decimals: "85,25", "72,50", "80,00".
- Rerata skor stays at one decimal, as today.
- Scores already saved keep their value and show as "80,00".
- When they upload a file with "Unggah berkas", then a score with up to
  two decimals, with a comma or a dot, is ready; one with more decimals
  is skipped with "Skor harus angka 0–100, paling banyak 2 angka di
  belakang koma".

## Not included

- The category limits ("Ambang skor") stay whole numbers from 1 to 100.
- Other score screens (Asesmen karakter, SIKU, SKPM).

## Decided

1. "Unggah berkas" follows the same rule as the form.
2. A score is always written with two decimals, so every score in a
   column has the same form.
3. A dot is read the same as a comma, since some phones show only a dot
   on the number keypad.

## Steps

- [x] 1. A fitness score is stored with up to two decimals, and the
  category rule handles decimals, with checks.
- [x] 2. "Formulir kolektif" accepts and saves scores with up to two
  decimals.
- [ ] 3. Scores show with two decimals in the list, the student detail,
  Profil saya and the Dashboard.
- [ ] 4. "Unggah berkas" accepts scores with up to two decimals.
