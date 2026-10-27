# Profil saya: One line when all MEDALI values are equal

Group: Profil saya and Tugas saya
Kind: fix, found in the Profil saya audit

## What we want

On Profil saya, the card "Capaian karakter" names the strongest and the
weakest MEDALI value in one line: "Paling menonjol pada (value)
(score). Perlu perhatian pada (value) (score)." When all six values
have the same score, it names the same value twice, for example
"Paling menonjol pada Mandiri (85). Perlu perhatian pada Mandiri (85).",
which tells the student nothing and reads as a mistake.

## Who it is for

Mahasiswa, on Profil saya.

## What should happen

- When a Mahasiswa opens Profil saya and all six scores of the latest
  assessment are the same, then the line reads "Semua nilai MEDALI sama
  (score)." instead of naming one value twice.
- When a Mahasiswa under a Ringan or Sedang penalty opens Profil saya,
  the scores are held at 70, and the stored scores are all the same,
  then it reads "Sebelum pembatasan, semua nilai MEDALI sama (score)."
- When at least two values differ, then the line stays as it is today.
- When the card shows "Garis putus-putus menunjukkan semester lalu.",
  then that sentence still follows the new line.
- On a phone the line wraps with no sideways scroll.

## Not included

- The same line on the staff card in the Mahasiswa menu, where every
  student under a penalty shows the same value twice (all held at 70).
  That card is another menu page and gets its own fix if wanted.
- How the strongest and the weakest value are picked when only some
  scores are equal.

## Decisions

1. The wording follows the card's own "Paling menonjol pada …" line,
   with the score once, so the student still sees the number.
2. The new line shows only on the student's own card; the staff card
   keeps today's line.

## Steps

- [x] 1. The student's own "Capaian karakter" says "Semua nilai MEDALI
  sama (score)." when all six scores are equal, with checks for the
  plain case, the case under a penalty, and the case with differing
  scores.
