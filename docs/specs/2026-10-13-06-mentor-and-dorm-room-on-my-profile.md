# My mentor and dorm room on my profile

Depends on: My profile, Mentor groups, Dorm residents and rooms

## What we want

The first card on Profil saya gains two lines the student cares about:
who their pengasuh is, with their kelompok pengasuhan, and which dorm
room they live in. Both are read only.

## Who it is for

- Mahasiswa: their own lines only.

## What should happen

- When a student with a pengasuh opens Profil saya, then the line
  Pengasuh shows the mentor's name with title, and under it "Kelompok
  pengasuhan (code), diasuh sejak (date)".
- When the group had other mentors before, then the same line adds
  "Sebelumnya: (names)".
- When the student has no group yet, then Pengasuh shows "Belum
  ditetapkan".
- When a student who lives in the dorm opens the page, then the line
  Asrama shows the dorm, floor and room. A resident of Asrama
  Wismantara sees the dorm only, because it has no plotted rooms.
  Others see "Non asrama".
- When the student is moved to another group or room, then the page
  shows the new one the next time it is opened.
- When the student presses the mentor's name or the group code, then
  nothing opens: they are plain text, because the Pengasuh menu is not
  theirs.
- When a student asks for a mentor's page, a group's member list or a
  room's residents by a hand-made request, then it is refused. Confirmed
  by a check.
- When the lines are read, then only the mentor's name and title are
  sent to the student's browser, not the mentor's NIP, e-mail or other
  groups. Confirmed by a check.
- When the page is opened on a phone, then the two lines wrap inside the
  card with no sideways scroll.

## Not included

- The names of the other students in the group or in the room.
- Contacting the mentor from the app.

## Better than the prototype

- The server sends only what the line shows. The prototype holds every
  mentor's full record in the browser.
- A student with no group and a student outside the dorm each get a
  clear line instead of an empty one.

## Decided

1. A student does not see their roommates' names here. The prototype
   does not show them on this page.
2. The line does not show how to reach the pengasuh, such as the campus
   e-mail. The prototype does not, and it is the mentor's personal data.

Decided while building, because the issue did not say:

3. The right to read one's own student record also covers one's own
   Pengasuh and Asrama lines. No new right is added, and the right to
   see the floor and room of other students stays as it is.
4. A resident of Asrama Dana Rakca or Asrama Cipta Bakti who has no room
   yet sees the dorm with "Belum diplot", as the student detail says it.
5. A student whose group has no pengasuh today sees "Belum ditetapkan"
   with the group's code under it, as the student detail does.
6. The two lines sit where the student detail has them: Asrama after
   Jenis kelamin, and Pengasuh as the last line of the card.
7. While no academic period runs no semester is known, so a Reguler
   student shows "Non asrama" then, as everywhere else in the app.

## Steps

- [x] 1. The server adds the student's own mentor, group and room to
  their profile, limited to the fields shown, with its checks.
- [x] 2. The first card shows the Pengasuh and Asrama lines, with the
  empty cases.
