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

1. The four categories count each student's final category, the more
   serious of the latest test and the latest note, as the bars of
   "Kategori" on Penilaian jasmani do. "Sudah dites" and "belum dites"
   are about the test itself, as there too, so a student with no test
   but a note that sets a category counts in that category and as not
   tested.
2. "(n) dari (total) sudah dites": n is the Aktif students of the
   filtered group with a fitness test, of any year; total is all its
   Aktif students. The card and section 3 show counts only from 5 tested
   students. With none tested they say so; with 1 to 4 they show only
   "Rekap ditampilkan setelah minimal 5 mahasiswa dites, agar identitas
   tidak dapat ditebak.", and the server reads out no count for them.
3. The percent "prima dan baik" is of the students with a category, a
   student with only a note among them, so it never passes 100. It shows
   "-" while Prima and Baik together hold 1 to 4, as it would give that
   number back, the same as the share on Asrama > Kesehatan.
4. From 5 tested students, every count of 1 to 4, of a category or of
   those not tested, is sent as "<5", the same rule as the dorm health
   numbers. A "<5" category takes no part of the card's bar, which lays
   the categories along the whole group, as in the prototype, so those
   not tested leave its end empty.
5. The illness line is read only by an account with the right to "Rekap
   data kesehatan seluruh mahasiswa", which only Kepala Unit holds, and
   only within the students that right lets it see. For every other
   account the server reads no illness at all. The numbers are read by
   the page itself, as for section 1, so there is no other address to
   ask.
6. The illness line counts, among the filtered group's students in Perlu
   perhatian or Perlu tindak lanjut medis, each illness picked in their
   latest note. "Lainnya" is left out, as it names no illness. It names
   at most four, as the prototype does, the most common first, with
   ties in the order of "Riwayat penyakit". Illnesses of 1 to 4 students
   show as "<5" and come after the others in the order of "Riwayat
   penyakit", so their order does not tell which is larger. With no such
   illness there is no line. It reads "Riwayat penyakit terbanyak pada
   kategori perlu perhatian dan perlu tindak lanjut medis: Asma (12),
   Hipertensi (<5)."
7. A "<5" can still be worked out by taking the other categories from
   those tested, and two filters can be compared. This is left as it is,
   as on section 1: the three roles already see each student's final
   category by name on Penilaian jasmani, within the same limit of
   program, so it shows them nothing new. The illness line, the one part
   they cannot see there, goes to Kepala Unit only, and has no total
   that it could be taken from.
8. Section 3 follows section 1, and its card follows the card "Capaian
   karakter", keeping the prototype's number 3 while section 2 is not
   built. Its title is "Kesehatan jasmani" with the prototype's line.
   "Kategori tes kebugaran" shows "(n) dari (total) sudah dites" beside
   its title, the bars with each range from the limits in force, then
   "(n) mahasiswa belum mengikuti tes kebugaran." as on Penilaian
   jasmani, then the illness line. Without counts the panel shows only
   "Belum ada hasil tes kebugaran." or the "Rekap ditampilkan…" line.
   A count sent as "<5" draws no bar.
9. "Lihat rincian" goes to Penilaian > Penilaian jasmani, and shows only
   to an account that may open that tab.

## Steps

- [x] 1. The "Kesehatan jasmani" card.
- [x] 2. "Kategori tes kebugaran" with the illness line and the
  small-group rule.
- [ ] 3. "Arti kategori".
