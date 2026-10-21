# Scores in the student detail

Depends on: Student list and detail, Character assessment, Character
grade list, Health notes, Mental health screening, Sharing the screening
level, Mentoring notes
Group: Mahasiswa

## What we want

The Mahasiswa list and the student detail get the scores they were
waiting for. The list gets the columns and filters for capaian karakter
and nilai karakter. The detail gets one panel per kind of result, and
each role sees only the panels it is allowed to. Opening a student's
name from a Penilaian list shows the same detail.

## Who it is for

- Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi (own
  program), Pengasuh (own mentees): character and fitness panels, in
  the student detail they can already open.
- Penilai Mahasiswa: from a name in a list on their Penilaian tabs
  only; they see the name, NIM, program studi and status, and the
  character panels. Konselor: from a name in a list on their own tabs
  only; the same four lines and the mental health panel. Neither
  gets the Mahasiswa menu or any other part of the detail.

## What should happen

- When a role with the Mahasiswa menu looks at the list, then each row
  also shows the predikat with Rerata and the character letter with its
  final score, or "Belum diasesmen" and "Belum lengkap"; with filters by
  predikat and "Belum memenuhi batas lulus". Still 25 a page.
- When an allowed role opens a student, then "Capaian karakter semester
  (n)" shows the medal, Rerata, predikat, source and date, the strongest
  and weakest value; with no assessment it says so, and Kepala Unit and
  Penilai Mahasiswa get "Input asesmen", which opens the form for that
  student.
- When they look at "Nilai karakter (KEP-220)", then it shows the
  letter, final score, four bars with weights, and "Memenuhi" or "Belum
  memenuhi batas lulus nilai karakter minimal (letter)."
- When Kepala Unit, Direktur, Ketua Program Studi or Pengasuh looks at
  "Kesehatan jasmani", then it shows the test score, date and final
  category. The note's text shows to Kepala Unit and to Pengasuh for
  their own mentees. Direktur / Wakil Direktur and Ketua Program Studi
  see the score, date and category only: no note text, no illness, and
  no mark that a note exists; none of it is sent to their screen.
  Confirmed by a check.
- When Konselor opens a student, then "Kesehatan mental" shows the
  level, instrument, date and advice of the latest screening.
- When Kepala Unit, Direktur, Ketua Program Studi or Pengasuh opens a
  student whose data is shared with them, then "Kesehatan mental" shows
  only what was shared, marked "Dipublikasikan konselor". Not shared: no
  mental health panel at all, with no hint that data exists.
- When Penilai Mahasiswa presses a student's name in a list on their
  Penilaian tabs, or Konselor in "Daftar mahasiswa" on Penilaian >
  Kesehatan mental, then the detail opens with the name, NIM, program
  studi, status and only their own panels.
- When Penilai Mahasiswa opens a student, then there is no fitness or
  mental health panel. When Konselor opens one, then there are no
  character or fitness panels.
- When any role asks by hand for a panel it may not see, or for a
  student outside its program or groups, then it is refused and the
  answer is the same whether or not the data exists. Confirmed by a
  check.
- When a sharing is withdrawn while the detail is open, then the mental
  health panel is gone on the next load.
- When opened on a phone, then the detail is one column and the new list
  columns fold into the card. The detail shows within about 1 second,
  and the list stays within about 1 second with the new columns.

## Not included

- Panels for SIKU, discipline, coaching and mentoring notes.
- The student's own view (My character achievement, My character grade
  and SIKU record, My health on my profile).
- Past semesters in the detail.
- A limit on scores: they show as stored (Score limit under a
  discipline penalty).

## Better than the prototype

- A refused mental health panel looks the same as "no data", so its
  absence tells nothing.
- Penilai Mahasiswa and Konselor get a detail made of only their panels.
- The list filters are worked out by the server, so pages stay at 25.

## Decided

1. Penilai Mahasiswa gets no fitness panel in the detail, as in the
   prototype, although they enter fitness scores.
2. Konselor and Penilai Mahasiswa have no Mahasiswa menu. They reach the
   detail only from the lists on their own tabs, and see the name, NIM,
   program studi, status and their own panels, nothing else.
3. Pengasuh gets no list columns: they have no Mahasiswa menu and use
   Pengasuhan for their own mentees.
4. The panels shown are decided by named rights in the one list of what
   each role may do: one for the character panels, one for the fitness
   panel and one for the fitness note text. Konselor's mental health
   panel uses Konselor's right to record screenings, and a recipient's
   uses the right to read shared counselling data. A panel that is
   refused is left out, exactly as when there is no data.
5. Penilai Mahasiswa reach the detail from a name on every Penilaian tab
   where they see a list of students: SIKU (already), Penilaian
   jasmani, Daftar nilai karakter, Perlu pembinaan and Data SKPM; on
   Asesmen karakter the name already opens "Riwayat asesmen", and it
   keeps doing that, so the same name does not change meaning there.
   The students they reach are the ones those tabs already list.
6. Konselor reaches the detail from the name in "Daftar mahasiswa" on
   Penilaian > Kesehatan mental, for the students that list already
   holds. Konselor's panel shows the latest screening only, with its
   advice; the "Risiko" mark, the scores and the note stay in "Rincian".
7. A recipient's panel shows the latest screening's level, instrument,
   date and advice only when the sharing holds the level, read on each
   load and added to the log of readings, as the sharing's own list
   does. The sharing's other parts stay on "Data yang dipublikasikan
   untuk Anda". A sharing without the level gives no panel.
8. A role that may open the full detail and also has a brief panel, such
   as a Kepala Unit who is also Konselor, sees the full detail with
   every panel any of its roles allows.
9. "Capaian karakter" shows the student's latest assessment, as the
   other character screens do; the semester in its title is the
   student's semester. "Input asesmen" shows only for an Aktif student
   and opens Asesmen karakter with that student picked in the form.
10. The predikat filter offers each predikat and "Belum diasesmen", as
    in the prototype. The grade filter offers "Memenuhi batas lulus" and
    "Belum memenuhi batas lulus", in the same words as Daftar nilai
    karakter.
11. The fitness panel says "Belum mengikuti tes kebugaran." with no test
    score. Kepala Unit and Pengasuh also see the note text, or "Belum ada
    catatan kesehatan." when the category asks for attention, as in the
    prototype.

## Steps

- [x] 1. Which role sees which panel is added to the permission list,
  with a check for each role that may and may not.
- [x] 2. The list gets the two columns and filters.
- [x] 3. "Capaian karakter" and "Nilai karakter (KEP-220)" in the
  detail.
- [x] 4. "Kesehatan jasmani" in the detail, with the note rule.
- [x] 5. "Kesehatan mental" for Konselor and for recipients of a
  sharing.
- [x] 6. Names in the Penilaian lists that do not open it yet,
  Konselor's "Daftar mahasiswa" on Kesehatan mental among them, open
  the detail.
