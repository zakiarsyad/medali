# Dorm residents' health notes on Penilaian jasmani

Depends on: Penilaian: Health notes, Asrama: Dorm health notes
Group: Penilaian

Urgent: Penilai Mahasiswa reads the illness and note text that BAM -
Kesehatan wrote about dorm residents, which is personal health data shown
to a role that should not see it.

## What we want

A dorm resident's health notes are written on Asrama > Kesehatan, and only
the dorm list reads their text: Kepala Unit, BAM - Kesehatan, Pengelola
Asrama, BAM - BPHK, and Pengasuh for their own mentees. The health notes
spec says the others "get nothing on Penilaian". But the column "Catatan
kesehatan" in "Hasil tes kebugaran" on Penilaian > Penilaian jasmani shows
the latest note's illnesses and text for every student, including dorm
residents. So Penilai Mahasiswa reads them. Penilai's form already refuses
dorm residents, so only the column leaks.

## Who it is for

- Penilai Mahasiswa, who should see a dorm resident's category only.
- Kepala Unit and Pengasuh (own mentees), who keep seeing the text, as both
  lists allow.

## What should happen

- When Penilai Mahasiswa looks at "Hasil tes kebugaran", then for a dorm
  resident the column "Catatan kesehatan" shows no illness, no note text
  and no mark that a note exists or is missing, as Direktur sees it. The
  category still shows, as the more serious of the test and the latest
  note. Confirmed by a check.
- When Penilai Mahasiswa looks at a student who does not live in the dorm,
  then nothing changes: the illnesses and text show as today.
- When Kepala Unit, or Pengasuh for an own mentee, looks at a dorm
  resident, then nothing changes: the illnesses and text show as today.
- When Penilai Mahasiswa asks for a dorm resident's note text by hand, by
  search, filter or page settings, then no note text is sent. Confirmed by
  a check.

## Not included

- The category itself, which stays the same on Asrama > Kesehatan,
  Penilaian jasmani and the student detail.
- Who writes notes, and the recap of Kepala Unit.

## Better than the prototype

- Nothing new. This follows the health notes and dorm health notes specs.

## Decided

1. Penilai Mahasiswa still sees a dorm resident's category, the way
   Direktur does, because the category is also shaped by the fitness test
   that Penilai records. Only the note's illnesses and text, the mark
   "berdasarkan catatan kesehatan", and the mark that a note exists or is
   missing are hidden.
2. A dorm resident is a student who lives in a dorm today, by the same rule
   as the list on Asrama > Kesehatan. While no period runs nobody lives in
   the dorm, so every note reads as it does for a student outside it.
3. Penilai Mahasiswa keeps the column "Catatan kesehatan", for the
   students outside the dorm. A dorm resident's cell in it is left empty.
4. An account with several roles reads a resident's note text only when
   one of its roles on the dorm list sees that resident, and one of its
   roles reads notes on Penilaian jasmani. Penilai Mahasiswa who is also
   Pengasuh reads their own mentees' only.
5. The student detail needs no change: only Kepala Unit and Pengasuh read
   notes there, and both are on the dorm list.

## Steps

- [ ] 1. "Hasil tes kebugaran" shows a dorm resident's note text only to
  roles on the dorm list, with checks for Penilai Mahasiswa, Kepala Unit
  and Pengasuh.
