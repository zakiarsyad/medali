# Dorm residents set by hand

Depends on: Kakak pendamping are dorm residents
Group: Asrama

## What we want

Not every Internasional or Pembibitan student lives in the dorm, and some
students outside the rule do. The resident rule stays as the starting
point, and Pengelola Asrama can change it for one student on Ploting
kamar: make a "Non asrama" student a resident, or make a resident "Non
asrama".

## Who it is for

- Change: Pengelola Asrama.
- See the result: every role that sees residents today.

## What should happen

- When Pengelola Asrama opens Ploting kamar, then they see the button
  "Tambah penghuni", and each resident in a room card or in "Belum
  diplot" has the button "Jadikan non asrama".
- When they press "Tambah penghuni", then they choose an active student
  who is "Non asrama", an Asrama that fits the student's jenis kelamin
  (Wismantara Putra or Cipta Bakti for men, Wismantara Putri or Dana
  Rakca for women) and an optional Keterangan; on "Simpan" the student
  appears in "Belum diplot" of that dorm, and a message confirms it.
- When the chosen Asrama does not fit the student's jenis kelamin, then
  nothing is saved and a message says why.
- When they press "Jadikan non asrama" and confirm, then the student
  leaves their room and the dorm, and shows as "Non asrama" everywhere
  on the next load. This works for Internasional and Pembibitan students
  too.
- When a student made "Non asrama" by hand is added again with "Tambah
  penghuni", then they are a resident again.
- When a choice made by hand exists, then it stays when the student
  moves to semester 3, and ends when their status becomes Cuti or Non
  Aktif; after that the usual rule applies. Confirmed by a check.
- When the student is an active kakak pendamping, then "Jadikan non
  asrama" is not offered; the duty must be stopped first.
- When a resident is added or made "Non asrama", then the log records
  who did it, when, and what it was before. Confirmed by a check.
- When BAM - Kerumahtanggaan or a read-only role opens Ploting kamar,
  then the two buttons do not show, and a hand-made request is refused
  by the server. Confirmed by a check.
- When two people change the same student at the same time, then one
  change is saved and the other sees a message. Confirmed by a check.
- When Ploting kamar is opened on a phone, then the button and the form
  fit with no sideways scroll.

## Not included

- Changing residents in bulk or from a file.
- Changing residents from the Mahasiswa list or detail.

## Decided

1. Only Pengelola Asrama makes the change; every other role sees the
   result only.
2. The choice of Asrama is limited by jenis kelamin.

## Steps

- [x] 1. A choice made by hand is stored and the one resident rule reads
  it, with checks and the log.
- [x] 2. "Tambah penghuni" on Ploting kamar.
- [ ] 3. "Jadikan non asrama" on Ploting kamar.
