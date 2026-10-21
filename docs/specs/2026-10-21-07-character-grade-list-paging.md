# Daftar nilai karakter worked out by the database

Depends on: nothing beyond what is merged
Group: Penilaian
Kind: fix, found by "App-wide audit: Activities and scores"

## What we want

"Daftar nilai karakter" on Penilaian karakter shows 25 students a page,
but each time the tab is opened, searched, filtered or paged, the server
reads every Aktif student the role may see and all four parts of each
one, works out every grade, and only then keeps the 25 rows of the page.
The four numbers at the top are worked out the same way. The audit asks
that "the grade list and the other score lists of Penilaian stay paged
and are worked out by the database", and the building rules say a long
list is loaded a page at a time and the database is asked only for what
the screen needs. After this work the database finds, counts and pages
the students, and the server reads the parts of the 25 students shown.

Seen in "App-wide audit: Activities and scores", on a local computer with
sample data:

- As Kepala Unit, the tab reads 188 Aktif students and the Kehadiran,
  Pengasuhan, SIKU and SKPM of each, for a page of 25 ("1–25 dari 188
  mahasiswa"), and took 0.9 second to load. The next page, a search for
  one name and the filter "Belum lengkap" read all 188 again.
- The work grows with the number of students and their records: with a
  full campus and a full semester of activities, every visit reads them
  all.
- "Daftar nilai SIKU" on Penilaian SIKU and "Nilai SKPM per mahasiswa"
  on Data SKPM already let the database search, count and page.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur, Penilai Mahasiswa, Ketua Program
Studi and Pengasuh, who open Penilaian karakter.

## What should happen

- When a role opens the tab, then the list, its 25 rows a page, the
  search by name or NIM and the filters "Belum memenuhi batas lulus" and
  "Belum lengkap" are worked out by the database, and the server reads
  the parts of the students on the page only.
- When the four numbers at the top are shown (Rerata nilai akhir,
  Memenuhi minimal, Mendapat penyesuaian SIKU, Belum lengkap), then the
  database works them out, without sending every student's row to the
  server.
- Every grade, letter, pass, "Belum lengkap", Keterangan, number and
  page shows exactly as today, for every role and its own students.
  Confirmed by a check that compares both ways on the sample data.
- A page past the end still shows the last page, as today.
- The tab shows within about 1 second with 25 rows.

## Not included

- How the parts are written in the list: it has its own issue,
  "Penilaian: Kehadiran and SKPM written with one decimal on Daftar nilai
  karakter".
- The grade rule, the Skema bobot and who sees which students.
- The grade on other screens (Dashboard, the student detail, Profil
  saya).

## Decided

1. The grades are not kept in a stored table. The grade stays live, as
   the grade list spec decided; the database works it out when the tab
   is read.
2. The Kehadiran rule is not written twice. One rule, used by both, so
   the two numbers can never differ.
3. The scheme is read first and its limits are given to the database
   with the question, so the letter and the pass filter are worked out
   there.

## Decisions

1. How Kehadiran keeps one rule: the rule the student's own page uses
   decides, for each counted schedule, each angkatan it may be meant for
   and each way a student can stand at it (nothing sent, waiting, valid,
   rejected, dispensation), what it adds to attended and counted; and
   for each mark of a mentor meeting the same. The database is given
   that small table and only adds it up for each student. A check proves
   the added-up result equals the rule over all of a student's
   schedules.
2. The short sums after Kehadiran (the percent to one decimal, SIKU held
   within 0–100, Nilai SKPM, Nilai akhir and its letter) are given to the
   database as well, since the filters and the four numbers need them.
   The server keeps its own for the rows shown and for the other
   screens. A check works out both on many values, ties at .5 among
   them, and they must agree.
3. The 25 rows shown are worked out as today, from parts read for those
   25 students only. The database decides which 25 and how many match.
4. Rerata nilai akhir adds the final scores in the order of the list,
   as the server did, so it rounds exactly as today.
5. The search finds a part of the name or the NIM in any case, as on
   "Daftar nilai SIKU".

## Steps

- [x] 1. The database finds, counts and pages "Daftar nilai karakter",
  with its search and filters, and the parts are read for the page only.
- [ ] 2. The four numbers at the top are worked out by the database.
