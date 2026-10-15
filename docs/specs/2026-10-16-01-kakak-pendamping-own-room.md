# Room of a kakak pendamping where a student's own room is shown

Depends on: Asrama: Dorm companions
Group: Asrama

## What we want

A student who lives in Wismantara may be kakak pendamping of Asrama Dana
Rakca or Asrama Cipta Bakti, and then has one room only: the room they
are placed in as kakak pendamping. Every place that shows a student's
own room still looks only at a room in the dorm the student lives in, so
it says "Belum diplot" or names only the dorm for such a student,
although they have a room. Those places show the kakak pendamping room
instead, marked as such, as the prototype does.

## Who it is for

- The student, in the Asrama page header and on Profil saya.
- Every role that sees the Asrama column on the student lists and the
  room on the student detail.

## What should happen

- When a resident of Wismantara is placed in a room as kakak pendamping,
  then the Asrama page header, Profil saya, the student detail and the
  Asrama column of the student lists show that room with the words
  "(kakak pendamping)" after it, for example "Asrama Dana Rakca, lantai
  1, kamar 102 (kakak pendamping)", instead of "Belum diplot". Confirmed
  by a check.
- When that student is taken out of the room, or the duty is stopped
  with "Nonaktifkan", then those places say "Belum diplot" again.
- When a resident has a room in the dorm they live in, then nothing
  changes: that room is shown as today.
- When a student who lives in no dorm is kakak pendamping, then nothing
  changes on these places: they still show what they show today for a
  student who lives in no dorm.
- When a role may not see a student, then it sees no room of that
  student either, as today. Confirmed by a check.

## Not included

- An Asrama menu for a kakak pendamping who lives in no dorm.
- Any change to Ploting kamar or to the tab Kakak pendamping.

## Better than the prototype

- Nothing new; this follows the prototype.

## Decided

1. The words after the room are "(kakak pendamping)", as in the
   prototype.
2. A kakak pendamping who lives in no dorm is left as today, because the
   issue "Dorm companions" does not include an Asrama menu for them.

Decided while building, because the issue did not say:

3. The student detail and Profil saya show no floor or room for a
   resident of Wismantara: they name the dorm only. "Belum diplot" there
   means what they show today: the dorm name. A resident of Wismantara
   placed as kakak pendamping shows the kakak pendamping room in its
   place, as the prototype does.
4. The student detail shows a room only to a role that may see the floor
   and the room of a student, today Kepala Unit. The kakak pendamping
   room follows the same rule, so every other role still sees the dorm
   name only.
5. Of the student lists, only Pengguna baru mahasiswa has an Asrama
   column. It names the dorm only, for every resident. For a resident
   of Wismantara placed as kakak pendamping it shows the kakak pendamping
   room instead, to a role that may see the floor and the room, as the
   student detail does. The Mahasiswa list has no Asrama column, only a
   label with the dorm name, and is left as it is.

## Steps

- [x] 1. The read of a student's own room gives the kakak pendamping
  room when the resident has no room in their own dorm, with a check.
- [x] 2. The Asrama page header, Profil saya, the student detail and the
  Asrama column show it with "(kakak pendamping)".
