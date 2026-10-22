# Dashboard: character grade

Depends on: Dashboard filter and character achievement; Character grade
list; Score limit under a discipline penalty
Group: Dashboard

## What we want

The Dashboard gets its second card and section 2, "Nilai karakter",
built like the prototype: the average final grade, how many meet the
minimum letter, the four parts of the grade with their weights, and the
spread of letters, overall and per cohort.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi (their own
program only).

## What should happen

- When one of the three roles opens Dashboard, then the card "Nilai
  karakter" sits between "Capaian karakter" and "Kesehatan jasmani" and
  shows the average Nilai akhir, "(percent)% memenuhi minimal (letter).
  (n) dibatasi 70." and a bar of the letter spread. Pressing it scrolls
  to section 2.
- When they look at section 2, then "Komponen nilai karakter" shows the
  average of Kehadiran, Pengasuhan, SIKU and SKPM, each with its weight
  in brackets, then "Rerata nilai akhir" and "Memenuhi minimal
  (letter)", and the prototype's line on Kehadiran and "dibatasi 70".
- When they look at "Sebaran huruf", then each letter shows how many
  students have it, letters below the minimum say "(belum lulus)", and
  the panel says "(n) belum lengkap, tidak dihitung".
- When they look at "Nilai karakter per angkatan", then each cohort
  shows the count, the four parts, Nilai akhir and the percent that
  meets the minimum, with the same cohort rule as section 1.
- When a student's grade is "Belum lengkap", then they are left out of
  every average, letter and percent, as on Penilaian karakter.
- When the filtered group has fewer than 5 students with a worked-out
  grade, then the card and section show only "Rekap ditampilkan setelah
  minimal 5 mahasiswa, agar nilai perorangan tidak dapat ditebak." The
  server sends no numbers for it. Confirmed by a check.
- When the weights or the minimum letter change in Penilaian, then the
  section uses the new ones on the next load.
- When no student in the filtered group has a worked-out grade, then the
  card and section say "Belum ada nilai karakter untuk mahasiswa ini."
  instead of zeros.
- When "Lihat rincian" is pressed, then Penilaian > Penilaian karakter
  opens; it shows only to an account that may open that tab.
- When the filter or Ketua Program Studi's program applies, then every
  number follows it, as in section 1.
- When Pegawai UPK or Penilai Mahasiswa sends a hand-made request for
  these numbers, then it is refused. Confirmed by a check.
- When the page is opened on a phone, then the panels stack and each
  cohort is a readable block, with no sideways scroll.
- When the page opens on the preview with sample data, then it still
  shows within about 1 second with this section added.

## Not included

- Working out the grade itself (Character grade list).
- Grades of a closed semester; only the live grades of the running
  semester show.
- Section 4 and Pendampingan.

## Better than the prototype

- An empty group shows a message, not averages of zero.
- The small-group rule: no numbers under 5 graded students.

## Decisions

1. Numbers show only from 5 students with a worked-out grade, as in
   section 1. From 5 up, letter counts are exact, as section 1's
   predikat counts are, since these roles see each grade by name on
   Penilaian karakter.
2. The average of each part counts only students whose grade is worked
   out, so the parts and Nilai akhir describe the same students.
3. "Dibatasi 70" counts every held-at-70 student in the group, also one
   whose grade is "Belum lengkap", as Penilaian karakter does.
4. "Sebaran huruf" says how many are "Belum lengkap" and left out.

## Decided while building

1. The card's bar lays each letter along the students with a worked-out
   grade, as in the prototype: the letters that meet the minimum in
   shades of green from the best down, those below it in red. The card
   shows no number while the group has none or 1 to 4 worked-out
   grades, only the line that says why.
2. The percent that meets the minimum is of the students with a
   worked-out grade, as a whole number, and Rerata nilai akhir is to one
   decimal, as on Penilaian karakter.
3. The average of each part is of the part as it is recorded, before
   the hold at 70, as Penilaian karakter shows the parts. Only Nilai
   akhir and the letter use the score held at 70.
4. "Komponen nilai karakter" names the parts in the prototype's words,
   "Kehadiran kegiatan", "Pengasuhan", "Sikap dan perilaku (SIKU)" and
   "SKPM", each bar out of 100. In "Sebaran huruf" each bar is as long
   as its share of the largest letter, green for a letter that meets the
   minimum and red below it, with "(n) mahasiswa" with a worked-out
   grade beside the title, as in the prototype.
5. Without numbers, section 2 shows only the line that says why, as
   section 1 does.

6. "Nilai karakter per angkatan" counts the students with a worked-out
   grade: "Jumlah" is those students of the row, a row shows only with
   at least 5 of them, and without any filter at least 20, and the rule
   of subtraction of section 1 counts them too. Its rows are ordered as
   in section 1, and the table shows only while section 2 has numbers.
   With no row it says "Tidak ada angkatan yang dapat ditampilkan.
   Angkatan tampil bila minimal 20 mahasiswa sudah memiliki nilai akhir
   dan nilai perorangan tidak dapat ditebak dari angkatan lain.", with 5
   instead of 20 under a filter.
7. The averages of the table are plain numbers, without the prototype's
   colours, as the parts have no predikat. The last column is headed
   "Memenuhi (letter)" with the minimum letter in force.

## Steps

- [x] 1. The "Nilai karakter" card.
- [x] 2. "Komponen nilai karakter" and "Sebaran huruf".
- [x] 3. "Nilai karakter per angkatan".
