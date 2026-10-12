# Asrama on the student lists

Depends on: Dorm residents and rooms, Student list and detail, Academic period

## What we want

The two student lists show who lives in the dorm, as the earlier specs
promised once Asrama exists. Pengaturan > Pengguna baru mahasiswa gets
the Asrama column and the number "Penghuni asrama". The Mahasiswa list
gets the Asrama filter and tag, and the student detail gets the Asrama
line.

## Who it is for

- Pengguna baru mahasiswa: Kepala Unit, Pegawai UPK and Pengelola
  Asrama, as today.
- Mahasiswa list and detail: the roles that already open them.

## What should happen

- When an allowed role opens Pengguna baru mahasiswa, then the list has
  the column Asrama (the dorm's name or "Non asrama") and the number
  "Penghuni asrama" with "dari mahasiswa yang ditambahkan".
- When they fill the form for a new student, then a note says whether
  that student will live in the dorm and in which one, from the jalur,
  kategori and semester.
- When a role with the Mahasiswa menu opens the list, then the filter
  "Semua asrama" offers each dorm and "Non asrama", and residents show
  their dorm as a tag.
- When they choose a dorm, then only its residents show, still 25 a
  page; with no match the usual empty text shows.
- When Kepala Unit opens a resident, then the detail shows the line
  Asrama with the dorm, floor and room, or "Belum diplot"; a resident
  of Asrama Wismantara shows the dorm only, because it has no plotted
  rooms; a student outside the dorm shows "Non asrama". Every other
  role that opens the detail sees the dorm's name only, and the floor
  and room are not sent to their screen. Confirmed by a check.
- When a student stops being a resident, then the tag, the line and the
  count follow on the next load. Confirmed by a check.
- When Ketua Program Studi uses the filter, then it still shows only
  their program; a hand-made request for others is refused. Confirmed
  by a check.
- When the lists are opened on a phone, then the Asrama tag sits in the
  card and the filter is in the folded filter bar.
- When the lists are opened on the preview, then they still show within
  about 1 second.

## Not included

- Plotting rooms and changing who is a resident (Dorm residents and
  rooms).
- The student's own Asrama line on Profil saya (My mentor and dorm room
  on my profile).
- The Asrama filter on Dashboard.

## Better than the prototype

- The filter is applied by the server, with the paging.
- "Belum diplot" shows for a resident with no room, instead of nothing.

## Decided

1. Floor and room show for Kepala Unit only. Every other role that
   opens the detail sees the dorm's name only. Pengelola Asrama does not
   open this detail.

Decided while building, because the issue did not say:

2. "Asrama Wismantara" is the two dorms the merged app has, Asrama
   Wismantara Putra and Asrama Wismantara Putri. Both now have plotted
   rooms, but the case is kept as written: their residents show the
   dorm only, for Kepala Unit too. It is the choice that shows less.
3. The dorm is named in full everywhere, as on Ploting kamar: "Asrama
   Dana Rakca", not "Dana Rakca".
4. For Kepala Unit, a resident of Dana Rakca or Cipta Bakti with a room
   shows "(dorm), lantai (n), kamar (number)", as the Asrama page header
   does, and one without a room shows "(dorm) · Belum diplot".
5. Each choice of the Asrama filter shows how many students it holds,
   like the other filters of the bar. It counts as one of the filters
   under "Filter" on a phone, and "Atur ulang filter" clears it.
6. "Non asrama" finds every student who lives in no dorm, whatever their
   status, together with the Status choice above the list.
7. Who is a resident is never stored. It is read from the one rule in
   "Dorm residents and rooms" each time, so a change of status, kategori
   or semester shows on the next load. While no academic period runs no
   semester is known, so only Internasional and Pembibitan students
   count as residents, as on Ploting kamar.
8. "Penghuni asrama" counts the residents among the students added
   through this menu and not removed.
9. The form's note follows the fields as they are filled: jalur,
   kategori, angkatan (which gives the semester), jenis kelamin and
   status. It says nothing until those needed are filled.
10. Seeing floor and room is a named right of its own in the list of
    what each role may do, held by Kepala Unit only.

## Steps

- [ ] 1. The Asrama column, the number "Penghuni asrama" and the form's
  note on Pengguna baru mahasiswa.
- [ ] 2. The Asrama filter and tag on the Mahasiswa list, with checks.
- [ ] 3. The Asrama line in the student detail.
