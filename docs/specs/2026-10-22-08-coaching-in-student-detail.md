# Coaching panel in the student detail

Depends on: Student list and detail, Mentoring notes, Students needing coaching, Character coaching list
Group: Mahasiswa

## What we want

The student detail shows staff the panel "Pembinaan (level)" that the
prototype shows there: the level, the status, the weakest value and the
staff note of a student who is on the coaching list. Staff then read a
student's coaching where they read everything else about that student,
without going to Pembinaan karakter and searching.

## Who it is for

- Kepala Unit and Direktur / Wakil Direktur: every student.
- Ketua Program Studi: students of their program only.
- Pengasuh: their own mentees only.
- These are the roles that already read the coaching list and can
  already open the student detail. No role gets a new page.

## What should happen

- When one of these roles opens the detail of a student who is on the
  coaching list, then they see a panel titled "Pembinaan intensif",
  "Pembinaan sedang" or "Pembinaan ringan", with the status as a badge
  (Teridentifikasi, Konseling, Pemantauan or Selesai), the line "Aspek
  terlemah: (value)." and, after it, the note saved with the status on
  Pembinaan karakter when there is one.
- When the student is not on the coaching list (no assessment, or above
  both limits), then there is no panel and no empty box.
- When the level, the status or the note changes on Pembinaan karakter,
  or a new assessment moves the student on or off the list, then the
  panel shows the new state the next time the detail is opened.
  Confirmed by a check.
- When the status is "Selesai", then the panel still shows, with that
  badge, as in the prototype.
- When they look at the panel, then it has no button: the status is
  changed on Pembinaan karakter only.
- When Penilai Mahasiswa, Konselor or Pembina Disiplin Mahasiswa opens
  the small detail they are allowed to see, then the panel is absent and
  its data is not sent to their screen. Confirmed by a check.
- When Pengasuh asks by hand for the panel of a student who is not their
  mentee, Ketua Program Studi for a student of another program, or any
  other role for any student, then it is refused, and the answer is the
  same whether or not the student is on the list. Confirmed by a check.
- When the detail is opened on a phone, then the panel is one column
  with no sideways scroll.
- When the detail is opened on the preview, then it still shows within
  about 1 second.

## Not included

- Changing the status or the note from the detail (Character coaching
  list).
- The rule that puts a student on the list and names the level
  (Students needing coaching).
- The student's own card on Profil saya (My coaching, mentoring notes
  and sanction status).
- A link from the panel to Pembinaan karakter; the prototype has none.
- The limits behind the levels are the prototype's values, to be
  confirmed by the campus before launch.

## Decided

1. The panel sits under the score and discipline panels and "Riwayat per
   semester", and above "Kesehatan jasmani", as in the prototype,
   everywhere the whole detail opens.
2. The panel stays after the status is "Selesai", with the badge
   "Selesai", as in the prototype; it goes away only when a new
   assessment takes the student off the list.
3. Pembina Disiplin Mahasiswa, Penilai Mahasiswa and Konselor do not see
   it in their small detail. The prototype shows it only to the roles
   that read mentoring notes.
4. Reading the panel needs no right of its own, as reading Pembinaan
   karakter needs none: the panel shows a student only within the rows
   Pembinaan karakter shows the account, from each of its roles that
   opens that tab. No role gains or loses anything. A second role of the
   same account that sees every student but does not open the tab adds
   no rows.
5. Who is listed, the level, "Aspek terlemah" and the status are read
   the same way Pembinaan karakter reads them: only an Aktif student
   whom their latest assessment lists, a student with no saved status
   shows "Teridentifikasi", and the note is the one kept with the
   current status. A student on Cuti or Non aktif gets no panel, as in
   the prototype.
6. "Aspek terlemah" names the value only, without its score, as in the
   prototype. The note follows on the same line.
7. A student outside the account's rows gets no panel at all, exactly as
   a student who is not on the list, so the screen tells nothing about
   whether they are listed. The data is read each time the detail opens;
   nothing is kept between openings.
8. The status badge and the panel's border use the coaching red the app
   already names, with no light red fill; the app names no colour like
   the prototype's soft one.

## Steps

- [x] 1. The read of one student's coaching for the detail, for the four
  roles within their rows, with its checks.
- [x] 2. The panel with the level, the status, "Aspek terlemah" and the
  note.
- [x] 3. No panel for a student off the list, and none for the roles
  with a small detail, with checks.
- [x] 4. The phone layout and the speed check.
