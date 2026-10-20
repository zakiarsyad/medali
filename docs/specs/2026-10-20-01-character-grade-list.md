# Character grade list

Depends on: Character grade scheme; SKPM data; SIKU adjustments; Mentoring meetings in the attendance score; Mentoring scores; Academic period
Group: Penilaian

## What we want

Penilaian karakter shows each student's semester character grade: the
four parts, the final score, the letter and whether it passes. Nothing is
typed in here. Every part is taken from where it is recorded, and the
grade is worked out with the Skema bobot.

## Who it is for

Read only: Kepala Unit, Direktur / Wakil Direktur, Penilai Mahasiswa,
Ketua Program Studi (own program), Pengasuh (own mentees).

## What should happen

- When a staff role opens the tab, then above "Skema bobot" they see four
  numbers (Rerata nilai akhir, Memenuhi minimal (letter) with how many do
  not, Mendapat penyesuaian SIKU, Belum lengkap) and below it "Daftar
  nilai karakter".
- When a grade is worked out, then Nilai akhir = the sum of each part ×
  its weight ÷ 100, shown to one decimal, and the letter and pass come
  from the scheme. With 25% each, parts 90, 80, 66, 72 give 77.0, B,
  passes; 60, 70, 64, 40 give 58.5, D, does not pass. With weights 40,
  20, 20, 20 the first gives 79.6. Confirmed by a check.
- When Kehadiran is read, then it is the student's Nilai kehadiran as
  "Mentoring meetings in the attendance score" works it out, activities
  and mentor meetings together; the rule is not repeated here.
- When the other parts are read, then Pengasuhan is the score the
  Pengasuh gave this semester, SIKU is the SIKU akhir, and SKPM is the
  Nilai SKPM, or 0 for a student with no rows once any SKPM upload
  counts.
- When a part is missing (no counted activity, no score from Pengasuh,
  or no SKPM upload at all), then the row shows "-" for it, "Belum
  lengkap" instead of a final score and letter, and is left out of the
  averages.
- When they look at the list, then each student shows Kehadiran with
  attended/counted, Pengasuhan, SIKU, SKPM, Nilai akhir, Huruf and
  Keterangan ("SIKU dasar (n)" or the gains and losses); with search,
  the filters "Belum memenuhi batas lulus" and "Belum lengkap", 25 a
  page.
- When a part changes anywhere (a verified attendance, a SIKU entry, an
  SKPM upload, the scheme), then the grade shown is the new one on the
  next load. Confirmed by a check.
- When Pengasuh asks by hand for a student outside their groups, Ketua
  Program Studi for another program, or a student or Konselor for the
  list, then it is refused. No request can write a grade. Confirmed by a
  check.
- When used on a phone, then each student is a card with the four parts
  and the letter, no sideways scroll. The tab shows within about 1
  second on the preview with 25 rows.

## Not included

- "Dibatasi 70": a final score held at 70 for students under a light or
  medium discipline punishment (Score limit under a discipline penalty).
- The grade on Beranda (Dashboard character grade), in the student
  detail (Scores in the student detail) and on Profil saya (My character
  grade and SIKU record).
- A printed report or a file to download.
- Closing a semester and fixing its grades: the grade stays live.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- No made-up numbers fill a missing part; the row says "Belum lengkap".
- The filters "Sudah diinput" and "Data contoh" are dropped.
- The fourth number is "Belum lengkap" until "Dibatasi 70" can be built.

## Decided

1. A student with a missing part stays "Belum lengkap" at the end of the
   semester; nothing counts a missing part as 0.
2. The grade is not fixed when the semester ends; it is live and nobody
   fixes it in this spec.
3. The running semester is read from "Academic period", to pick this
   semester's Pengasuhan score and counted activities.
4. The letter and pass are taken from Nilai akhir as it is shown, to one
   decimal, so the number and the letter never disagree.
5. The list holds the Aktif students only, by name, as "Daftar nilai
   SIKU" and Data SKPM do.
6. "Belum memenuhi batas lulus" holds only students whose grade is worked
   out and below the pass letter; a "Belum lengkap" student is under its
   own filter only.
7. Keterangan reads "SIKU dasar 65" for a student with no SIKU entry in
   force, otherwise Nilai dasar with the gains and losses, such as
   "SIKU 65 +5 / −3", as the prototype does.
8. Kehadiran shows the score with attended/counted under it; a student
   with nothing counted yet shows "-". Huruf shows "-" while the grade is
   "Belum lengkap".
9. Every role that opens the tab sees all four parts of its own
   students, as "Who it is for" says, also a role that does not open the
   tab of a part, such as Penilai Mahasiswa for Pengasuhan.

## Steps

- [x] 1. The rule for the final score, letter, pass and "Belum lengkap",
  with checks. Kehadiran is read from "Mentoring meetings in the
  attendance score".
- [x] 2. "Daftar nilai karakter" with search, filters and pages, limited
  to each role's own students.
- [ ] 3. The four numbers at the top.
