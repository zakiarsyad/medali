# Kakak pendamping are dorm residents

Depends on: Dorm companions, Room of a kakak pendamping where a student's own room is shown
Group: Asrama

## What we want

Every active kakak pendamping lives in the dorm they serve. Today one who
does not fit the resident rule, such as a Reguler student in semester 3,
can be placed in a room but still counts as "Non asrama". From now on an
active kakak pendamping counts as a resident of the dorm they serve, on
every screen that uses who is a resident.

## Who it is for

- Every role that sees the Asrama column, filter, tag or line on the
  student lists and detail, and the Asrama tabs that list residents.
- The kakak pendamping, in the Asrama page header and on Profil saya.

## What should happen

- When Pengelola Asrama names a student kakak pendamping of Asrama Dana
  Rakca, then on the next load that student is a resident of Dana Rakca:
  the Mahasiswa list shows the tag, the filter "Asrama Dana Rakca" finds
  them, and "Non asrama" no longer does. Confirmed by a check.
- When the kakak pendamping has a room, then the student detail, the
  Asrama column, the Asrama page header and Profil saya show it with
  "(kakak pendamping)" after it, as today; without a room they show
  "Asrama Dana Rakca · Belum diplot".
- When a resident of Wismantara is kakak pendamping of Dana Rakca or
  Cipta Bakti, then they count as a resident of the dorm they serve only,
  not of Wismantara.
- When the duty is stopped with "Nonaktifkan", or their status becomes
  Cuti or Non Aktif, then on the next load they follow the usual resident
  rule again. Confirmed by a check.
- When an Asrama tab lists the residents of a dorm (such as attendance
  or cleaning duties), then an active kakak pendamping of that dorm is
  among them. Confirmed by a check.
- When Pengelola Asrama opens Ploting kamar, then kakak pendamping are
  still counted under their own number "Kakak pendamping", not under
  "Penghuni", and "Isi otomatis" still never places them.
- When "Penghuni asrama" is counted on Pengguna baru mahasiswa, then an
  active kakak pendamping is counted.
- When a role may not see a student, then it sees no dorm or room of
  that student either, as today. Confirmed by a check.

## Not included

- Adding or removing residents by hand (Dorm residents set by hand).
- Any change to who may be named kakak pendamping.

## Decided

1. Kakak pendamping stay under their own number on Ploting kamar, not
   under "Penghuni".
2. An active kakak pendamping is listed on every Asrama tab that lists
   the residents of their dorm.

## Steps

- [ ] 1. An active kakak pendamping counts as a resident of the dorm they
  serve, in the one resident rule, with checks.
- [ ] 2. The student lists, detail, Asrama page header and Profil saya
  show them as residents of that dorm.
