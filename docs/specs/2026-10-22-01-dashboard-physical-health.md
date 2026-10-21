# Dashboard: physical health

Depends on: Dashboard filter and character achievement; Fitness test scores; Health notes
Group: Dashboard

## What we want

The Dashboard gets its third card and section 3, "Kesehatan jasmani",
built like the prototype: how many students fall in each fitness
category, how many are not tested yet, and what each category means. It
shows counts only, never a name, because health records are sensitive.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi (their own
program only).

## What should happen

- When one of the three roles opens Dashboard, then the card "Kesehatan
  jasmani" shows the percent "prima dan baik", "(n) dari (total) sudah
  dites", how many "perlu tindak lanjut medis", and a bar of the four
  categories. With no test yet it shows "-" and "Belum ada hasil tes
  kebugaran dari (total) mahasiswa."
- When no student in the group is tested yet, then section 3 says "Belum
  ada hasil tes kebugaran." instead of four empty bars.
- When they look at section 3, then "Kategori tes kebugaran" shows the
  count for Prima, Baik, Perlu perhatian and Perlu tindak lanjut medis,
  each with its score range, and how many have not been tested.
- When students in the two lower categories have a recorded illness
  history, then Kepala Unit sees a line that names the most common
  illnesses with their counts, and no student. Direktur / Wakil
  Direktur and Ketua Program Studi do not get this line, also by a
  hand-made request: Health notes gives those roles numbers and
  categories only, never an illness. Confirmed by a check.
- When they look at "Arti kategori", then each category shows its range
  and meaning, as in Penilaian.
- When "Lihat rincian" is pressed, then Penilaian > Penilaian jasmani
  opens, where the usual limits on who sees whom apply.
- When the filter or Ketua Program Studi's program applies, then every
  number follows it.
- When a filtered group has fewer than 5 tested students, then the
  counts and the illness line are hidden with "Rekap ditampilkan setelah
  minimal 5 mahasiswa dites, agar identitas tidak dapat ditebak." A
  category or an illness that covers 1 to 4 students shows as "<5". The
  server sends no smaller number. Confirmed by a check.
- When Penilai Mahasiswa or Konselor sends a hand-made request for these
  numbers, then it is refused. Confirmed by a check.
- When the page is opened on a phone, then the two panels stack with no
  sideways scroll.
- When the page opens on the preview with sample data, then it still
  shows within about 1 second.

## Not included

- Any list of names. Names are seen only in Penilaian and Asrama, by the
  roles allowed there.
- Section 4 and Pendampingan.

## Better than the prototype

- A group with no test yet shows a message instead of empty bars.
- The small-group rule: no count under 5.
- Direktur / Wakil Direktur and Ketua Program Studi do not see the
  illness line.

## Decisions

1. Every count that covers fewer than 5 students is hidden, also when
   the whole filtered group is under 5, the same rule as the mental
   health rekap.

## Decided while building

## Steps

- [ ] 1. The "Kesehatan jasmani" card.
- [ ] 2. "Kategori tes kebugaran" with the illness line and the
  small-group rule.
- [ ] 3. "Arti kategori".
