# Character grade scheme

Depends on: nothing beyond what is merged
Group: Penilaian

## What we want

Penilaian gets the tab "Penilaian karakter" with its first panel, "Skema
bobot". It holds the rules of the semester character grade under KEP-220:
the weight of each of the four parts, the lowest score for each letter,
and the letter needed to pass. Kepala Unit changes them; other staff read
them. The grades themselves come with Character grade list.

## Who it is for

- Change: Kepala Unit (right "Bobot penilaian").
- Read: Direktur / Wakil Direktur, Ketua Program Studi, Pengasuh, Penilai
  Mahasiswa.

## What should happen

- When a staff role opens Penilaian karakter, then "Skema bobot" shows
  four weights (Kehadiran kegiatan, Nilai pengasuhan, Nilai sikap dan
  perilaku (SIKU), Nilai Sistem Kredit Prestasi Mahasiswa), a coloured
  bar of their shares, "Total (n)%", the sentence "Nilai akhir = …" with
  the weights filled in, "Konversi huruf (batas bawah)" and "Batas lulus
  nilai karakter".
- When nothing has been changed yet, then the weights are 25% each, the
  letters are A from 85, B from 70, C from 60, D from 50, E below 50,
  the pass letter is B, and the note says "Bobot awal belum disesuaikan
  dengan KEP-220."
- When Kepala Unit changes a weight, then the bar, the total and the
  sentence follow at once. While the total is not 100, "Simpan skema"
  cannot be pressed and it says "Total bobot harus 100%."
- When Kepala Unit presses "Simpan skema" with weights 40, 20, 20, 20,
  then a confirmation says that every student's final grade will be
  worked out again; after it, the message says "Skema bobot disimpan.
  Semua nilai akhir dihitung ulang." and the note becomes "Ditetapkan
  (date) oleh (name)."
- When a letter's lower limit is not below the one before it (for
  example B 85 with A 85), then nothing is saved: "Batas bawah huruf
  harus menurun dari A ke D."
- When a weight or limit is not a whole number 0–100, then nothing is
  saved and the field says so.
- When the scheme is read, then a score gets the first letter whose
  limit it reaches: with the starting scheme 85 is A, 84.9 is B, 70 is
  B, 69.9 is C, 49.9 is E; with pass letter B, A and B pass and C does
  not. Confirmed by a check.
- When a read-only role opens the panel, then the fields cannot be typed
  in, there is no "Simpan skema", and it says "Skema bobot ditetapkan
  oleh Kepala Unit Pembangunan Karakter."
- When Penilai Mahasiswa, Pengasuh or a student sends a scheme by hand,
  or a scheme whose weights do not total 100 is sent by hand, then the
  server refuses it. Confirmed by a check.
- When two people change the scheme at once, then the second save is
  refused with "Skema sudah diubah oleh (name). Muat ulang." Pressing
  "Simpan skema" twice saves once. Every change goes into the log with
  the scheme before and after. Confirmed by a check.
- When used on a phone, then the four weights stack with no sideways
  scroll. The panel shows within about 1 second.

## Not included

- The grades, the list and the numbers at the top (Character grade list).
- The limit of 70 for students under a discipline punishment (Score
  limit under a discipline penalty).
- The fitness limits, which have their own panel in Penilaian jasmani.
- A scheme per semester, and closing a semester: there is one current
  scheme, as in the prototype.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- Saving asks for confirmation, because it changes every student's grade.
- Two people cannot overwrite each other without knowing.
- The server also checks the total and the order, not only the screen.

## Decided

1. The real KEP-220 weights, letter limits and pass letter are not known
   yet. The scheme starts with the prototype's numbers, and Kepala Unit
   sets the real ones.
2. There is one current scheme, as in the prototype. A change applies to
   every grade shown, also for semesters that are already over.
3. A weight may be 0, which switches that part off, as in the prototype.

## Steps

- [x] 1. The scheme is stored with who changed it and when, and starts
  with the prototype's numbers; the right "Bobot penilaian" is added for
  Kepala Unit, with its checks. Fitness test scores uses the same right.
- [x] 2. The letter and pass rules, with checks.
- [x] 3. The tab and "Skema bobot" show, read only.
- [x] 4. Kepala Unit changes and saves the scheme, with the confirmation
  and the refusal of a second save.
